import { httpServerHandler } from 'cloudflare:node';
import { env } from 'cloudflare:workers';
import express from 'express';
import { createKV, deleteKV, getKV, getKVList } from './kvController';
import { createMember, deleteMember, getAllMembers, getMemberById, updateMember } from './membersController';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
	res.json({ message: 'Express.js running on Cloudflare Workers!' });
});
app.post('/sendmail', async (req, res) => {
	const { to, subject, user } = req.body;
	if (!to || !subject || !user) {
		return res.status(400).json({ error: 'All required fields' });
	}
	const from = env.MAILGUN_DOMAIN;
	await env.mail_queue.send({ to, subject, user, otp: Math.floor(Math.random() * 1000000), from });
	res.json({ message: 'Email sent successfully!' });
});
app.get('/kv/set/:key/:value', createKV);
app.get('/kv/get/:key', getKV);
app.get('/kv/all', getKVList);
app.get('/kv/del/:key', deleteKV);

// GET all members
app.get('/api/members', getAllMembers);

// GET a single member by ID
app.get('/api/members/:id', getMemberById);

// POST - Create a new member
app.post('/api/members', createMember);

app.put('/api/members/:id', updateMember);

// DELETE - Delete a member
app.delete('/api/members/:id', deleteMember);

app.listen(3000);
export default httpServerHandler({ port: 3000 });
