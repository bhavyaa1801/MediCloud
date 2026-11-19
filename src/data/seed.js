// Synthetic demo data only. Field names mirror the future Firestore schema.
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const pad = (n) => String(n).padStart(2, '0')

export default function seed() {
  const departments = [
    ['General Medicine', 'Primary care and chronic condition management', 'Dr. Rohan Verma'],
    ['Cardiology', 'Heart and vascular care, diagnostics and rehabilitation', 'Dr. Priya Nair'],
    ['Neurology', 'Brain, spine and nervous system disorders', 'Dr. Sameer Khan'],
    ['Dermatology', 'Skin, hair and nail conditions', 'Dr. Isha Malhotra'],
    ['Orthopedics', 'Bone, joint and sports injuries', 'Dr. Arjun Reddy'],
    ['Pediatrics', 'Healthcare for infants, children and teens', 'Dr. Kavya Iyer'],
    ['Gynecology', 'Women’s health, maternity and fertility', 'Dr. Neha Bansal'],
    ['Emergency Medicine', '24/7 trauma and critical care', 'Dr. Vikram Singh'],
  ].map(([name, description, head], i) => ({ id: `DEP-${i + 1}`, name, description, head }))

  const docRows = [
    ['Rohan Verma', 0, 'Internal Medicine', 12, 600, 'MBBS, MD (Medicine)'],
    ['Priya Nair', 1, 'Interventional Cardiology', 15, 1200, 'MBBS, DM (Cardiology)'],
    ['Sameer Khan', 2, 'Neurology', 11, 1100, 'MBBS, DM (Neurology)'],
    ['Isha Malhotra', 3, 'Clinical Dermatology', 8, 800, 'MBBS, MD (Dermatology)'],
    ['Arjun Reddy', 4, 'Joint Replacement', 14, 1000, 'MBBS, MS (Orthopedics)'],
    ['Kavya Iyer', 5, 'Pediatrics', 9, 700, 'MBBS, DCH, MD (Pediatrics)'],
    ['Neha Bansal', 6, 'Obstetrics & Gynecology', 13, 900, 'MBBS, MS (OBG)'],
    ['Vikram Singh', 7, 'Emergency Care', 10, 500, 'MBBS, MD (Emergency Medicine)'],
    ['Sunita Desai', 0, 'Family Medicine', 7, 500, 'MBBS, DNB (Family Medicine)'],
    ['Manish Gupta', 1, 'Cardiac Electrophysiology', 18, 1500, 'MBBS, MD, DM (Cardiology)'],
  ]
  const doctors = docRows.map(([n, d, specialization, experience, fee, qualifications], i) => ({
    id: `DOC-${pad(i + 1)}`, name: `Dr. ${n}`,
    email: i === 0 ? 'doctor@MediCloud.demo' : `${n.split(' ')[0].toLowerCase()}@MediCloud.demo`,
    phone: `+91 98100 ${10000 + i * 137}`, departmentId: departments[d].id, specialization, experience, fee,
    qualifications, bio: `${specialization} specialist with ${experience} years of clinical practice.`,
    workingDays: i % 3 === 2 ? [1, 3, 5] : [1, 2, 3, 4, 5], start: '09:00', end: '17:00',
    breakStart: '13:00', breakEnd: '14:00', slotMinutes: 30, blockedDates: [], status: 'active',
  }))

  const first = ['Aarav', 'Diya', 'Kabir', 'Ananya', 'Rahul', 'Sneha', 'Vivaan', 'Meera', 'Aditya', 'Riya', 'Karan', 'Pooja', 'Siddharth', 'Nisha', 'Yash', 'Tanvi', 'Harsh', 'Divya', 'Nikhil', 'Shreya']
  const last = ['Mehta', 'Kapoor', 'Sharma', 'Joshi', 'Patel', 'Agarwal', 'Rao', 'Chopra', 'Bose', 'Menon']
  const patients = first.map((f, i) => ({
    id: `PT-${1001 + i}`, name: `${f} ${last[(i * 3) % 10]}`,
    email: i === 0 ? 'patient@MediCloud.demo' : `${f.toLowerCase()}.${last[(i * 3) % 10].toLowerCase()}@mail.demo`,
    phone: `+91 97000 ${20000 + i * 211}`, dob: `${1962 + ((i * 7) % 40)}-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
    gender: i % 2 ? 'Female' : 'Male', bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i % 5],
    address: `${12 + i}, Sector ${3 + (i % 9)}, New Delhi`, emergencyContact: `+91 96000 ${30000 + i * 97}`,
    registeredOn: iso(-(400 - i * 17)), status: i === 13 ? 'inactive' : 'active',
  }))

  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00']
  const offsets = [-30, -21, -14, -10, -7, -5, -3, -1, 0, 0, 1, 2, 3, 5, 7, 9, 12, 15]
  const reasons = ['Routine check-up', 'Chest discomfort', 'Recurring headaches', 'Skin rash', 'Knee pain', 'Fever and cough', 'Follow-up consultation', 'Blood pressure review']
  const appointments = offsets.map((o, i) => {
    const doc = doctors[i % 3 === 0 ? 0 : (i * 3) % 10]
    const pat = patients[i % 4 === 0 ? 0 : i % 20]
    return {
      id: `APT-${2001 + i}`, patientId: pat.id, doctorId: doc.id, departmentId: doc.departmentId,
      date: iso(o), time: times[(i * 2) % times.length], reason: reasons[i % reasons.length], fee: doc.fee,
      status: o < 0 ? (i % 7 === 0 ? 'Cancelled' : 'Completed') : i % 3 === 0 ? 'Pending' : 'Confirmed',
      createdAt: iso(o - 3),
    }
  })

  const recTypes = ['Blood Report', 'MRI Report', 'X-Ray Report', 'Lab Report', 'Consultation Record']
  const records = Array.from({ length: 12 }, (_, i) => {
    const doc = doctors[i % 3 === 0 ? 0 : i % 10]
    const type = recTypes[i % 5]
    return {
      id: `REC-${3001 + i}`, patientId: patients[i % 4 === 0 ? 0 : i % 20].id, doctorId: doc.id, type,
      name: `${type.replace(' Report', '').replace(' Record', '')} — ${['CBC panel', 'Lumbar spine', 'Chest PA view', 'Lipid profile', 'General visit'][i % 5]}`,
      date: iso(-(5 + i * 6)), fileName: `${type.toLowerCase().replace(/\s/g, '-')}-${3001 + i}.pdf`,
      notes: 'Findings within expected limits; correlate clinically. Follow-up advised if symptoms persist.',
    }
  })

  const meds = [
    { name: 'Paracetamol', dosage: '500 mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' },
    { name: 'Amoxicillin', dosage: '250 mg', frequency: 'Three times daily', duration: '7 days', instructions: 'Complete the full course' },
    { name: 'Atorvastatin', dosage: '10 mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take at bedtime' },
    { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once daily', duration: '10 days', instructions: 'May cause drowsiness' },
  ]
  const prescriptions = Array.from({ length: 9 }, (_, i) => ({
    id: `RX-${4001 + i}`, patientId: patients[i % 3 === 0 ? 0 : i % 20].id, doctorId: doctors[i % 3 === 0 ? 0 : i % 10].id,
    date: iso(-(3 + i * 5)), medicines: [meds[i % 4], meds[(i + 1) % 4]].slice(0, (i % 2) + 1),
    notes: 'Review after course completion.',
  }))

  const resources = [
    ['Consultation Room 101', 'Consultation Room', 0], ['Consultation Room 102', 'Consultation Room', 1],
    ['Consultation Room 103', 'Consultation Room', 2], ['Consultation Room 104', 'Consultation Room', 4],
    ['ICU Bed 01', 'Bed', 7], ['ICU Bed 02', 'Bed', 7], ['Ward Bed 12', 'Bed', 0], ['Maternity Bed 03', 'Bed', 6],
    ['ECG Machine A', 'Equipment', 1], ['MRI Scanner', 'Equipment', 2], ['Digital X-Ray Unit', 'Equipment', 4], ['Ventilator V2', 'Equipment', 7],
  ].map(([name, type, d], i) => ({
    id: `RES-${pad(i + 1)}`, name, type, departmentId: departments[d].id,
    status: [1, 5, 6, 9].includes(i) ? 'occupied' : i === 10 ? 'maintenance' : 'available',
    assignedTo: i === 5 ? patients[3].id : i === 6 ? patients[7].id : i === 1 ? patients[0].id : null,
  }))

  const users = [
    { id: 'u-ADM-01', profileId: 'ADM-01', name: 'Hospital Admin', email: 'admin@MediCloud.demo', role: 'admin', status: 'active' },
    { id: 'u-REC-01', profileId: 'REC-01', name: 'Meera Singh', email: 'reception@MediCloud.demo', role: 'receptionist', status: 'active' },
    ...doctors.map((d) => ({ id: `u-${d.id}`, profileId: d.id, name: d.name, email: d.email, role: 'doctor', status: 'active' })),
    ...patients.map((p) => ({ id: `u-${p.id}`, profileId: p.id, name: p.name, email: p.email, role: 'patient', status: p.status })),
  ]

  const ts = (h) => new Date(Date.now() - h * 3600e3).toISOString()
  const notifications = [
    ['u-PT-1001', 'Appointment confirmed', 'Your appointment with Dr. Rohan Verma has been confirmed.', 'appointment', 2, false],
    ['u-PT-1001', 'New prescription uploaded', 'Dr. Rohan Verma added a prescription to your account.', 'prescription', 28, false],
    ['u-PT-1001', 'Lab report available', 'Your Lipid profile report is ready to view.', 'record', 70, true],
    ['u-PT-1001', 'Appointment cancelled', 'A previous appointment was cancelled as requested.', 'cancellation', 150, true],
    ['u-DOC-01', 'New appointment booked', 'Aarav Mehta booked a consultation with you.', 'appointment', 1, false],
    ['u-DOC-01', 'Schedule reminder', 'You have appointments scheduled today.', 'reminder', 5, false],
    ['u-DOC-01', 'Report uploaded', 'A lab report was linked to one of your patients.', 'record', 50, true],
    ['u-ADM-01', 'New patient registered', 'A new patient completed registration.', 'user', 3, false],
    ['u-ADM-01', 'Resource under maintenance', 'Digital X-Ray Unit is marked under maintenance.', 'resource', 20, false],
    ['u-ADM-01', 'Daily summary ready', 'Yesterday’s appointment summary is available.', 'reminder', 40, true],
  ].map(([userId, title, message, type, h, read], i) => ({ id: `NTF-${5001 + i}`, userId, title, message, type, read, createdAt: ts(h) }))

  const auditRows = [
    ['Hospital Admin', 'Added doctor', 'Dr. Manish Gupta', 'Success'], ['Dr. Rohan Verma', 'Updated consultation', 'APT-2005', 'Success'],
    ['Aarav Mehta', 'Booked appointment', 'APT-2011', 'Success'], ['Dr. Priya Nair', 'Uploaded prescription', 'RX-4004', 'Success'],
    ['Hospital Admin', 'Updated resource', 'RES-11', 'Success'], ['Unknown user', 'Failed login attempt', 'admin@MediCloud.demo', 'Failed'],
    ['Hospital Admin', 'Deactivated patient', 'PT-1014', 'Success'], ['Diya Kapoor', 'Cancelled appointment', 'APT-2008', 'Success'],
    ['Dr. Kavya Iyer', 'Uploaded report', 'REC-3006', 'Success'], ['Hospital Admin', 'Updated department', 'DEP-5', 'Success'],
  ]
  const audit = auditRows.map(([actor, action, resource, status], i) => ({ id: `LOG-${6001 + i}`, actor, action, resource, status, timestamp: ts(i * 7 + 1) }))

  const settings = { hospitalName: 'MediCloud Multispeciality Hospital', email: 'info@MediCloud.demo', phone: '+91 11 4000 1234', address: '21 Health Avenue, New Delhi, India', onlineBooking: true, emailAlerts: true, cancelWindowHours: 2 }
  const staff = [{ id: 'REC-01', name: 'Meera Singh', email: 'reception@MediCloud.demo', phone: '+91 98100 55555', status: 'active' }]
  return { staff, departments, doctors, patients, appointments, records, prescriptions, resources, users, notifications, audit, settings }
}
