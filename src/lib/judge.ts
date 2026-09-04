export interface JudgeResult {
  route: 'ask' | 'book';
  message?: string;
}

export function judge(formData: {
  customer: string;
  kind: string;
  form: string;
  date: string;
  address: string;
  slotsWanted: string[];
}): JudgeResult {
  const emptyFields: string[] = [];

  if (!formData.customer.trim()) emptyFields.push('고객사');
  if (!formData.kind.trim()) emptyFields.push('종류');
  if (!formData.form.trim()) emptyFields.push('형태');
  if (!formData.date.trim()) emptyFields.push('날짜');
  if (formData.slotsWanted.length === 0) emptyFields.push('희망 슬롯');

  if (formData.form === '외근' && !formData.address.trim()) {
    emptyFields.push('위치');
  }

  if (emptyFields.length > 0) {
    return {
      route: 'ask',
      message: `빈 칸: ${emptyFields.join(', ')}`,
    };
  }

  return {
    route: 'book',
  };
}
