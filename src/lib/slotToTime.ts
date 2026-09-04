export function slotToTime(slot: string): string {
  const slotMap: Record<string, string> = {
    오전: '10:00',
    '오후-1': '13:00',
    '오후-2': '15:00',
  };
  return slotMap[slot] || '10:00';
}

export function slotToEndTime(slot: string): string {
  const slotMap: Record<string, string> = {
    오전: '12:00',
    '오후-1': '15:00',
    '오후-2': '17:00',
  };
  return slotMap[slot] || '11:00';
}
