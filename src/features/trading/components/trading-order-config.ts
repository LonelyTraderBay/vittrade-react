export const PCT_BUTTONS = [25, 50, 75, 100];

export const ORDER_TYPE_BASIC = [
  { id: 'market', label: 'Thị trường' },
  { id: 'limit', label: 'Giới hạn' },
  { id: 'stop', label: 'Dừng lỗ' },
];

export const ORDER_TYPE_ADVANCED = [
  { id: 'stop-limit', label: 'Stop-Limit' },
  { id: 'trailing', label: 'Trailing Stop' },
  { id: 'oco', label: 'OCO' },
];

export function getOrderTypeLabel(orderTypeId: string) {
  return (
    [...ORDER_TYPE_BASIC, ...ORDER_TYPE_ADVANCED].find((type) => type.id === orderTypeId)?.label ??
    'Giới hạn'
  );
}
