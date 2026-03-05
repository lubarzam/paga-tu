const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Sends a receipt image to Claude vision and returns extracted items.
 * @param {string} imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param {string} mimeType    - MIME type of the image (e.g. "image/jpeg")
 * @returns {Promise<Array<{ name: string, amount: number }>>}
 */
async function extractItemsFromReceipt(imageBase64, mimeType) {
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: imageBase64 },
        },
        {
          type: 'text',
          text: `Analiza esta boleta o ticket de compra.
Extrae cada ítem con su precio unitario o subtotal.
Devuelve SOLO un JSON válido con este formato exacto:
{"items": [{"name": "nombre del ítem", "amount": 1234}]}
Reglas:
- Los montos deben ser números enteros sin símbolo de moneda, sin puntos de miles, sin comas decimales.
- Omite totales, subtotales, propinas, descuentos e impuestos — solo ítems individuales.
- Si el texto está en otro idioma, traduce los nombres al español.`,
        },
      ],
    }],
  });

  const text = response.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude no devolvió un JSON válido');

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.items)) throw new Error('Formato de respuesta inesperado');

  return parsed.items.map(item => ({
    name:   String(item.name || '').trim(),
    amount: Number(item.amount) || 0,
  }));
}

module.exports = { extractItemsFromReceipt };
