export enum Role {
  SUPERADMIN = 'superadmin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export enum Language {
  UZ = 'uz',
  RU = 'ru',
  EN = 'en',
}

export enum GroupStatus {
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export enum GroupMembershipStatus {
  ACTIVE = 'active',
  REMOVED = 'removed',
}

export enum NotificationType {
  DEBT_REMINDER = 'debt_reminder',
  GROUP_ENDING = 'group_ending',
  INSURANCE_EXPIRING = 'insurance_expiring',
  PAYMENT_RECEIVED = 'payment_received',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
}

export enum TransferDirection {
  GIVEN = 'given',
  RECEIVED = 'received',
}

export enum CashflowType {
  INCOME = 'income',
  EXPENSE = 'expense',
}
