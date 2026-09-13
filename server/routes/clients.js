import express from 'express';
import { pool, isPgConnected, fallbackStore, loadClientsFromDisk, saveClientsToDisk, recalculateClientMetrics } from '../db.js';

const router = express.Router();

function getDiskClients() {
  const disk = loadClientsFromDisk();
  if (disk && Array.isArray(disk) && disk.length > 0) {
    return disk;
  }
  return fallbackStore.clients || [];
}

// GET /api/clients — Fetch all agency clients
router.get('/', async (req, res) => {
  try {
    const clients = getDiskClients();
    if (isPgConnected) {
      const result = await pool.query(
        'SELECT * FROM clients ORDER BY created_at DESC'
      );
      if (result.rows.length > 0) {
        return res.json({ clients: result.rows });
      }
    }
    return res.json({ clients });
  } catch (error) {
    console.error('Fetch clients error:', error);
    return res.status(500).json({ error: 'Failed to fetch agency clients' });
  }
});

// POST /api/clients — Create a new agency client
router.post('/', async (req, res) => {
  try {
    const {
      sales_person_code,
      sales_person_name,
      platform_source,
      source_profile,
      name,
      username,
      email,
      phone,
      country,
      company_name,
      category,
      reply_method,
      status,
      meeting_time,
      quotation_link,
      inbox_link,
      note,
      avatar_url,
      attachment_url,
    } = req.body;

    if (!name || !username) {
      return res.status(400).json({ error: 'Client Name and Username are required fields' });
    }

    const newClient = {
      id: req.body.id || `cli-${Date.now()}`,
      sales_person_code: sales_person_code || 'K001',
      sales_person_name: sales_person_name || 'Super Admin',
      platform_source: platform_source || 'Fiverr',
      source_profile: source_profile || '',
      name: name.trim(),
      username: username.trim().replace('@', ''),
      fiverr_username: username.trim().replace('@', ''),
      email: email || '',
      phone: phone || '',
      country: country || 'UNITED STATES',
      company_name: company_name || '',
      category: category || 'Web Development',
      reply_method: reply_method || 'Client messages',
      status: status || 'HOT',
      meeting_time: meeting_time || null,
      quotation_link: quotation_link || '',
      inbox_link: inbox_link || '',
      note: note || '',
      avatar_url: avatar_url || '',
      attachment_url: attachment_url || '',
      total_orders: Number(req.body.total_orders) || 1,
      total_spent: req.body.total_spent || '$0',
      created_at: new Date().toISOString(),
    };

    let clients = getDiskClients();
    clients.unshift(newClient);
    saveClientsToDisk(clients);

    // Run relational metrics sync to pick up existing projects
    recalculateClientMetrics(newClient.name);

    if (isPgConnected) {
      try {
        await pool.query(
          `INSERT INTO clients (
            id, sales_person_code, sales_person_name, platform_source, source_profile,
            name, username, email, phone, country, company_name, category, reply_method, status,
            meeting_time, quotation_link, inbox_link, note, avatar_url, attachment_url, total_orders, total_spent, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            username = EXCLUDED.username,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            status = EXCLUDED.status,
            country = EXCLUDED.country,
            company_name = EXCLUDED.company_name`,
          [
            newClient.id,
            newClient.sales_person_code,
            newClient.sales_person_name,
            newClient.platform_source,
            newClient.source_profile,
            newClient.name,
            newClient.username,
            newClient.email,
            newClient.phone,
            newClient.country,
            newClient.company_name,
            newClient.category,
            newClient.reply_method,
            newClient.status,
            newClient.meeting_time,
            newClient.quotation_link,
            newClient.inbox_link,
            newClient.note,
            newClient.avatar_url,
            newClient.attachment_url,
            newClient.total_orders,
            newClient.total_spent,
            newClient.created_at,
          ]
        );
      } catch (e) {
        console.warn('PG insert client error:', e.message);
      }
    }

    return res.status(201).json({
      message: 'Client created successfully',
      client: newClient,
    });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id — Update a client record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let clients = getDiskClients();
    const idx = clients.findIndex((c) => c.id === id);

    let updatedClient;
    if (idx !== -1) {
      updatedClient = {
        ...clients[idx],
        ...updateData,
        id, // preserve ID
      };
      clients[idx] = updatedClient;
    } else {
      updatedClient = { id, ...updateData, created_at: new Date().toISOString() };
      clients.unshift(updatedClient);
    }
    saveClientsToDisk(clients);

    // Relational calculation hook
    recalculateClientMetrics(updatedClient.name || updatedClient.username);

    if (isPgConnected) {
      try {
        const keys = Object.keys(updateData).filter((k) => k !== 'id');
        if (keys.length > 0) {
          const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
          const values = keys.map((k) => updateData[k]);
          await pool.query(
            `UPDATE clients SET ${setClause} WHERE id = $1`,
            [id, ...values]
          );
        }
      } catch (e) {}
    }

    return res.json({ message: 'Client updated successfully', client: updatedClient });
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id — Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let clients = getDiskClients();
    clients = clients.filter((c) => c.id !== id);
    saveClientsToDisk(clients);

    if (isPgConnected) {
      try {
        await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      } catch (e) {}
    }

    return res.json({ message: 'Client deleted successfully', id });
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
