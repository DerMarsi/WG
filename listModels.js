const { GoogleGenAI } = require('@google/genai');

async function list() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyARRT9uVmYzRbW3ogywv1JJVbmQHryoKCI" });
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      console.log(model.name);
    }
  } catch (err) {
    console.error(err);
  }
}
list();
