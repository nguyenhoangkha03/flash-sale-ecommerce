export interface ValidationError {
  field: string;
  message: string;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateCartQuantity = (
  quantity: number,
  availableStock: number
): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!Number.isInteger(quantity)) {
    errors.push({
      field: 'quantity',
      message: 'Số lượng phải là số nguyên',
    });
  }

  if (quantity < 1) {
    errors.push({
      field: 'quantity',
      message: 'Số lượng phải tối thiểu là 1',
    });
  }

  if (quantity > availableStock) {
    errors.push({
      field: 'quantity',
      message: `Số lượng không thể vượt quá ${availableStock} (tồn kho hiện tại)`,
    });
  }

  return errors;
};

export const validateCheckoutCart = (
  cartItems: any[]
): CartValidationResult => {
  const errors: ValidationError[] = [];

  if (!cartItems || cartItems.length === 0) {
    errors.push({
      field: 'cart',
      message: 'Giỏ hàng trống. Vui lòng thêm sản phẩm.',
    });
  }

  // Check if all items still have stock
  const outOfStockItems = cartItems.filter(
    (item) => item.available_stock < item.quantity
  );

  if (outOfStockItems.length > 0) {
    errors.push({
      field: 'stock',
      message: `${outOfStockItems.length} sản phẩm không đủ tồn kho. Vui lòng cập nhật số lượng.`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
