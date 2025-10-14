// Supabase Edge Function: Order Matching
// Deno runtime (TypeScript)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderMatchRequest {
  orderId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { orderId }: OrderMatchRequest = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simplified matching logic for MVP:
    // For market orders, immediately match at current market price
    // For limit orders, mark as open (manual matching can be added later)

    if (order.type === 'market') {
      // Market order: immediate execution
      const price = order.price || '50000'; // Fallback price if not set
      const quantity = parseFloat(order.quantity);
      const totalAmount = parseFloat(price) * quantity;

      // Fetch user assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', order.user_id);

      if (assetsError || !assets) {
        throw new Error('Failed to fetch user assets');
      }

      const btcAsset = assets.find((a) => a.asset_type === 'BTC');
      const usdtAsset = assets.find((a) => a.asset_type === 'USDT');

      if (!btcAsset || !usdtAsset) {
        throw new Error('Assets not initialized');
      }

      // Execute trade based on order side
      if (order.side === 'buy') {
        // Buy BTC with USDT
        const newBtcTotal = parseFloat(btcAsset.total) + quantity;
        const newBtcAvailable = parseFloat(btcAsset.available) + quantity;
        const newUsdtTotal = parseFloat(usdtAsset.total) - totalAmount;
        const newUsdtAvailable = parseFloat(usdtAsset.available) - totalAmount;

        // Update assets
        await supabase
          .from('assets')
          .update({ total: newBtcTotal.toString(), available: newBtcAvailable.toString() })
          .eq('id', btcAsset.id);

        await supabase
          .from('assets')
          .update({ total: newUsdtTotal.toString(), available: newUsdtAvailable.toString() })
          .eq('id', usdtAsset.id);
      } else {
        // Sell BTC for USDT
        const newBtcTotal = parseFloat(btcAsset.total) - quantity;
        const newBtcAvailable = parseFloat(btcAsset.available) - quantity;
        const newUsdtTotal = parseFloat(usdtAsset.total) + totalAmount;
        const newUsdtAvailable = parseFloat(usdtAsset.available) + totalAmount;

        // Update assets
        await supabase
          .from('assets')
          .update({ total: newBtcTotal.toString(), available: newBtcAvailable.toString() })
          .eq('id', btcAsset.id);

        await supabase
          .from('assets')
          .update({ total: newUsdtTotal.toString(), available: newUsdtAvailable.toString() })
          .eq('id', usdtAsset.id);
      }

      // Create trade record
      const { error: tradeError } = await supabase.from('trades').insert([
        {
          symbol: order.symbol,
          price,
          quantity: order.quantity,
          buyer_id: order.side === 'buy' ? order.user_id : null,
          seller_id: order.side === 'sell' ? order.user_id : null,
          buyer_order_id: order.side === 'buy' ? order.id : null,
          seller_order_id: order.side === 'sell' ? order.id : null,
          executed_at: new Date().toISOString(),
        },
      ]);

      if (tradeError) {
        console.error('Trade creation error:', tradeError);
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'filled',
          filled_quantity: order.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Market order matched successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Limit order: mark as open, matching logic can be added later
      await supabase
        .from('orders')
        .update({
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return new Response(
        JSON.stringify({ success: true, message: 'Limit order placed successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

