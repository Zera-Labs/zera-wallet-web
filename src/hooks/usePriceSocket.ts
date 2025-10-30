import { useEffect, useRef, useState } from 'react';
import { zPriceWsMessage, type PriceMessageData } from '../lib/priceSocket.schema';
import { useTokenFeed } from '@/stores/tokenFeed';

export function usePriceSocket(tokenAddresses: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceMessageData>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket('wss://price.zeralabs.org/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribeMany', tokenAddresses }));
        } catch (e) {
          console.error('Failed to subscribe', e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = zPriceWsMessage.parse(JSON.parse(event.data));
          if (parsed.type === 'price') {
            setPrices((prev) => ({
              ...prev,
              [parsed.tokenAddress]: parsed.data,
            }));
            try {
              const { setToken } = useTokenFeed.getState();
              setToken(parsed.tokenAddress, parsed.data);
            } catch {}
          }
        } catch (err) {
          console.error('Invalid WS message', err);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        console.warn('⚠️ WebSocket closed — retrying in 5s');
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [tokenAddresses.join(',')]);

  return prices;
}
