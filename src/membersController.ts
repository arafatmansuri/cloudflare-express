import { env } from 'cloudflare:workers';
import { Request, Response } from 'express';

export const getAllMembers: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	try {
		const { results } = await env.DB.prepare('SELECT * FROM members ORDER BY joined_date DESC').all();

		res.json({ success: true, members: results });
	} catch (error) {
		res.status(500).json({ success: false, error: 'Failed to fetch members' });
	}
};
export const getMemberById: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	try {
		const { id } = req.params;

		const { results } = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(id).all();

		if (results.length === 0) {
			res.status(404).json({ success: false, error: 'Member not found' });
			return;
		}

		res.json({ success: true, member: results[0] });
	} catch (error) {
		res.status(500).json({ success: false, error: 'Failed to fetch member' });
	}
};
export const createMember: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	try {
		const { name, email } = req.body;

		// Validate input
		if (!name || !email) {
			res.status(400).json({
				success: false,
				error: 'Name and email are required',
			});
			return;
		}

		// Basic email validation (simplified for tutorial purposes)
		// For production, consider using a validation library or more comprehensive checks
		if (!email.includes('@') || !email.includes('.')) {
			res.status(400).json({
				success: false,
				error: 'Invalid email format',
			});
			return;
		}

		const joined_date = new Date().toISOString().split('T')[0];

		const result = await env.DB.prepare('INSERT INTO members (name, email, joined_date) VALUES (?, ?, ?)')
			.bind(name, email, joined_date)
			.run();

		if (result.success) {
			res.status(201).json({
				success: true,
				message: 'Member created successfully',
				id: result.meta.last_row_id,
			});
		} else {
			res.status(500).json({ success: false, error: 'Failed to create member' });
		}
	} catch (error: any) {
		// Handle unique constraint violation
		if (error.message?.includes('UNIQUE constraint failed')) {
			res.status(409).json({
				success: false,
				error: 'Email already exists',
			});
			return;
		}
		res.status(500).json({ success: false, error: 'Failed to create member' });
	}
};

export const updateMember: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, email } = req.body;

		// Validate input
		if (!name && !email) {
			res.status(400).json({
				success: false,
				error: 'At least one field (name or email) is required',
			});
			return;
		}

		// Basic email validation if provided (simplified for tutorial purposes)
		// For production, consider using a validation library or more comprehensive checks
		if (email && (!email.includes('@') || !email.includes('.'))) {
			res.status(400).json({
				success: false,
				error: 'Invalid email format',
			});
			return;
		}

		// Build dynamic update query
		const updates: string[] = [];
		const values: any[] = [];

		if (name) {
			updates.push('name = ?');
			values.push(name);
		}
		if (email) {
			updates.push('email = ?');
			values.push(email);
		}

		values.push(id);

		const result = await env.DB.prepare(`UPDATE members SET ${updates.join(', ')} WHERE id = ?`)
			.bind(...values)
			.run();

		if (result.meta.changes === 0) {
			res.status(404).json({ success: false, error: 'Member not found' });
			return;
		}

		res.json({ success: true, message: 'Member updated successfully' });
	} catch (error: any) {
		if (error.message?.includes('UNIQUE constraint failed')) {
			res.status(409).json({
				success: false,
				error: 'Email already exists',
			});
			return;
		}
		res.status(500).json({ success: false, error: 'Failed to update member' });
	}
};

export const deleteMember: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	try {
		const { id } = req.params;

		const result = await env.DB.prepare('DELETE FROM members WHERE id = ?').bind(id).run();

		if (result.meta.changes === 0) {
			res.status(404).json({ success: false, error: 'Member not found' });
			return;
		}

		res.json({ success: true, message: 'Member deleted successfully' });
	} catch (error) {
		res.status(500).json({ success: false, error: 'Failed to delete member' });
	}
};
