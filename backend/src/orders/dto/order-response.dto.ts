import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

export class OrderItemResponseDto {
  id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
}

export class OrderResponseDto {
  id: string;
  user_id: string;
  reservation_id: string;
  status: string;
  total_amount: number;
  payment_id: string | null;
  payment_expires_at: Date | null;
  paid_at: Date | null;
  items_count: number;
  items: OrderItemResponseDto[];
  created_at: Date;
  updated_at: Date;

  static fromOrder(order: Order & { items: OrderItem[] }): OrderResponseDto {
    return {
      id: order.id,
      user_id: order.user_id,
      reservation_id: order.reservation_id,
      status: order.status,
      total_amount: order.total_amount,
      payment_id: order.payment_id,
      payment_expires_at: order.payment_expires_at,
      paid_at: order.paid_at,
      items_count: order.items?.length || 0,
      items: order.items?.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_snapshot: item.price_snapshot,
      })) || [],
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
