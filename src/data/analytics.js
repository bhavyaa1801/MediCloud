// Synthetic trend data for admin charts (historical series; live totals come from the services).
export const appointmentTrend = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m, i) => ({ month: m, appointments: [320, 355, 342, 410, 448, 472][i] }))
export const registrationTrend = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((m, i) => ({ month: m, patients: [48, 61, 55, 74, 82, 91][i] }))
export const PIE_COLORS = ['#4263EB', '#8275D9', '#16A36A', '#E8A23B', '#E05252', '#5C7CFA', '#B197FC', '#38B2AC']
