// One immutable catalog for the browser and Worker price/eligibility checks.
globalThis.TD_PACKAGES = Object.freeze([
  { id: '1', role: 'student-current', name: 'บัตรเข้างาน', shortName: 'บัตรเข้างาน', price: 99, hasShirt: false, desc: 'บัตรเข้าชมคอนเสิร์ต TRIAMDOD 10 (1 ใบ)' },
  { id: '2', role: 'student-current', name: 'บัตร + พวงกุญแจ + สติกเกอร์', shortName: 'บัตร+กุญแจ+สติกเกอร์', price: 179, hasShirt: false, desc: 'บัตรเข้างาน + พวงกุญแจที่ระลึก + สติกเกอร์ TRIAMDOD 10' },
  { id: '3', role: 'student-current', name: 'บัตร + เสื้อยืดคอนเสิร์ต', shortName: 'บัตร+เสื้อ', price: 339, hasShirt: true, desc: 'บัตรเข้างาน + เสื้อยืดคอนเสิร์ต TRIAMDOD 10 (1 ตัว)' },
  { id: '4', role: 'student-current', name: 'บัตร + เสื้อ + พวงกุญแจ + สติกเกอร์', shortName: 'บัตร+เสื้อ+กุญแจ+สติกเกอร์', price: 429, hasShirt: true, desc: 'บัตรเข้างาน + เสื้อยืดคอนเสิร์ต 1 ตัว + พวงกุญแจ + สติกเกอร์ครบชุด' },
  { id: '5', role: 'alumni', name: 'บัตร + เสื้อ (รับเองที่โรงเรียน)', shortName: 'บัตร+เสื้อ (รับเอง)', price: 399, hasShirt: true, desc: 'บัตรคอนเสิร์ต + เสื้อยืดคอนเสิร์ต 1 ตัว (รับเองหรือมีผู้รับแทนที่โรงเรียน)' },
  { id: '6', role: 'alumni', name: 'บัตร + เสื้อ (จัดส่งพัสดุ)', shortName: 'บัตร+เสื้อ (จัดส่ง)', price: 449, hasShirt: true, desc: 'บัตรคอนเสิร์ต + เสื้อยืดคอนเสิร์ต 1 ตัว (จัดส่งตามที่อยู่ +ค่าส่ง 50 บาท)' }
].map(Object.freeze));
