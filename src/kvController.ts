import { env } from 'cloudflare:workers';
import { Request, Response } from 'express';

export const createKV: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	const { key, value } = req.params;
	if (!key || !value || typeof key !== 'string' || typeof value !== 'string') {
		res.status(400).json({ error: 'Key and value are required' });
		return;
	}
	await env.kv1.put(key, value, { expiration: 60 * 5, expirationTtl: 60 * 5, metadata: { createdAt: new Date() } }); // Set expiration to 5 minutes
	res.json({ message: 'Value stored in KV successfully!' });
};
export const getKV: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	const { key } = req.params;
	if (!key || typeof key !== 'string') {
		res.status(400).json({ error: 'Key is required' });
		return;
	}
	const value = await env.kv1.getWithMetadata(key);
	res.json({ message: `${value ? 'Value found in KV' : 'Value not found in KV'}`, value: value.value ? value : null });
};
export const getKVList: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	const allKeys = await env.kv1.list();
	const keys = allKeys.keys.map((key) => key.name);
	const kvs = await Promise.all(
		keys.map(async (key) => {
			const value = await env.kv1.get(key);
			return { [key]: value };
		}),
	);
	res.json({ message: `All keys in KV`, kvs });
};
export const deleteKV: (req: Request, res: Response) => Promise<void> = async (req, res) => {
	const { key } = req.params;
	if (!key || typeof key !== 'string') {
		res.status(400).json({ error: 'Key is required' });
		return;
	}
	await env.kv1.delete(key);
	res.json({ message: 'Value deleted from KV successfully!' });
};
