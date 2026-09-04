import { requiredSlots, occupied, NEED } from './slots';

interface Booking {
  id?: number;
  customer: string;
  kind: string;
  date: string;
  slots_wanted?: string;
  decision?: string;
  slot_assigned?: string;
  candidate?: string;
  reason?: string;
  options?: string;
}

export interface DecideResult {
  decision: 'asking' | 'rejected' | 'review' | 'pending' | 'confirmed_auto';
  reason: string;
  options?: string[];
  candidate?: string[];
  slotAssigned?: string[];
  trace: string[];
}

export function decide(booking: Booking, allBookings: Booking[], autoOn: boolean): DecideResult {
  const trace: string[] = [];

  // 1. 빈 칸 검사
  const emptyFields: string[] = [];
  if (!booking.kind) emptyFields.push('종류');
  if (!booking.date) emptyFields.push('날짜');
  const wantedList = booking.slots_wanted ? booking.slots_wanted.split(',').map((s) => s.trim()) : [];
  if (wantedList.length === 0) emptyFields.push('희망 슬롯');

  if (emptyFields.length > 0) {
    const msg = `1 빈 칸 검사: ${emptyFields.join(', ')}`;
    trace.push(msg);
    return {
      decision: 'asking',
      reason: `빈 칸: ${emptyFields.join(', ')}`,
      trace,
    };
  }

  trace.push('1 빈 칸 검사: 없음');

  // 2. 필요한 칸 계산
  const needCount = NEED[booking.kind] || 0;
  trace.push(`2 종류 ${booking.kind} -> 필요한 칸 ${needCount}개 (희망 ${wantedList.join(', ')})`);

  // 3. 그 날짜에 점유된 칸 확인
  const occupied_set = occupied(booking.date, allBookings);
  const slotStatus: string[] = [];
  const SLOTS = ['오전', '오후-1', '오후-2'];
  SLOTS.forEach((slot) => {
    slotStatus.push(`${slot} ${occupied_set.has(slot) ? 'X' : 'O'}`);
  });
  trace.push(`3 ${booking.date} 달력: ${slotStatus.join(', ')}`);

  // 4. 희망 순서대로 후보 찾기
  const candidates: string[] = [];
  for (const wanted of wantedList) {
    const requiredForWanted = requiredSlots(booking.kind, [wanted]);
    const allAvailable = requiredForWanted.every((slot) => !occupied_set.has(slot));
    if (allAvailable) {
      candidates.push(...requiredForWanted);
      break;
    }
  }

  if (candidates.length === 0) {
    const available = SLOTS.filter((s) => !occupied_set.has(s));
    trace.push(`4 희망 순서대로 필요한 칸이 전부 빈 후보: 없음`);
    trace.push(`5 같은 날 대기 요청 비교: 비교 대상 없음`);
    trace.push(`결과: 거절 - 희망 슬롯 전부 찼음`);
    return {
      decision: 'rejected',
      reason: '희망 슬롯 전부 찼음',
      options: available,
      trace,
    };
  }

  trace.push(`4 희망 순서대로 필요한 칸이 전부 빈 후보: ${candidates.join('+')} `);

  // 5. 같은 날짜의 다른 pending 예약 중 동점 확인
  const sameDatePending = allBookings.filter(
    (b) => b.date === booking.date && b.decision === 'pending' && b.id !== booking.id && b.customer
  );

  let conflictingBooking: Booking | undefined;
  for (const otherBooking of sameDatePending) {
    const otherWanted = otherBooking.slots_wanted ? otherBooking.slots_wanted.split(',').map((s) => s.trim()) : [];
    const otherCandidates: string[] = [];

    for (const wanted of otherWanted) {
      const requiredForWanted = requiredSlots(otherBooking.kind, [wanted]);
      const allAvailable = requiredForWanted.every((slot) => !occupied_set.has(slot));
      if (allAvailable) {
        otherCandidates.push(...requiredForWanted);
        break;
      }
    }

    if (otherCandidates.length === 1 && candidates.length === 1 && otherCandidates[0] === candidates[0]) {
      conflictingBooking = otherBooking;
      break;
    }
  }

  if (conflictingBooking) {
    trace.push(`5 같은 날 대기 요청 비교: 겹치는 유일 후보 있음 - ${conflictingBooking.customer}`);
    trace.push(`결과: 검토필요 - ${booking.customer}와 ${conflictingBooking.customer} 동점`);
    return {
      decision: 'review',
      reason: `동점 - ${conflictingBooking.customer} 도 같은 칸이 유일 후보`,
      options: [booking.customer, conflictingBooking.customer],
      trace,
    };
  }

  trace.push(`5 같은 날 대기 요청 비교: 겹치는 유일 후보 없음`);

  if (autoOn) {
    trace.push(`결과: 확정-자동 - 빈 칸 ${candidates.join('+')} 확정`);
    return {
      decision: 'confirmed_auto',
      reason: `빈 칸 ${candidates.join('+')} 확정`,
      slotAssigned: candidates,
      trace,
    };
  } else {
    trace.push(`결과: 대기 - 후보 ${candidates.join('+')} 확정 버튼 대기`);
    return {
      decision: 'pending',
      reason: `후보 ${candidates.join('+')} - 확정 버튼 대기`,
      candidate: candidates,
      trace,
    };
  }
}
