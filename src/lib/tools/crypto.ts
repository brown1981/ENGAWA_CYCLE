import { ToolDefinition } from "./index";

/**
 * 📈 Cryptocurrency Price Tool
 * リアルタイムの仮想通貨価格を取得する「手足」
 */
export const get_crypto_price: ToolDefinition = {
  name: "get_crypto_price",
  description: "現在の仮想通貨の価格を表示通貨（JPY, USDなど）で取得します。例: BTC, ETH, SOL",
  parameters: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "通貨シンボル（例: BTC, ETH, JPY）",
      },
      currency: {
        type: "string",
        description: "表示通貨（例: JPY, USD）",
        default: "JPY",
      },
    },
    required: ["symbol"],
  },
  execute: async ({ symbol, currency = "JPY" }) => {
    try {
      const sym = symbol.toUpperCase();
      const curr = currency.toUpperCase();

      // リアルタイム価格（Crypto/USDT）と為替（USD/JPY）を併行取得
      const [cryptoRes, forexRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`),
        fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDCJPY")
      ]);

      if (!cryptoRes.ok) throw new Error(`Symbol ${sym} not found or API error.`);
      
      const cryptoData = await cryptoRes.json();
      const priceInUsd = parseFloat(cryptoData.price);

      let usdJpyRate = 150; // Fallback
      if (forexRes.ok) {
        const forexData = await forexRes.json();
        if (forexData?.price) usdJpyRate = parseFloat(forexData.price);
      }

      const finalPrice = curr === "JPY" ? priceInUsd * usdJpyRate : priceInUsd;

      return {
        symbol: sym,
        price: finalPrice.toLocaleString(),
        currency: curr,
        source: "Binance Public API",
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return { error: error.message || "Failed to fetch crypto price" };
    }
  },
};
