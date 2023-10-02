import axios from "axios";
import getColors from "get-image-colors";

// Ordenar por cor com mais contraste com a mais ocorrente na imagem

async function getAccentColor(imageUrl: string): Promise<number> {
  const { data } = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  const imageBuffer = Buffer.from(data, "base64");

  const colors = await getColors(imageBuffer, "image/jpeg");
  const hexColors = colors.map(color => color.hex());

  const mostUsedColor = hexColors[0];
  const accentColor = parseInt(mostUsedColor.slice(1), 16);

  return accentColor;
}

export default getAccentColor;
