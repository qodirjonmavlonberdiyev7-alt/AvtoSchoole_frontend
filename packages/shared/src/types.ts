import { CashflowType, GroupMembershipStatus, GroupStatus, Language, NotificationType, PaymentMethod, Role, TransferDirection } from './enums';

export interface UserDto {
  id: string;
  fullName: string;
  phone: string;
  role: Role;
  isActive: boolean;
  language: Language;
  avatarFilename: string | null;
  createdAt: string;
}

export interface GroupDto {
  id: string;
  name: string;
  category: string;
  teacherId: string;
  totalAmount: number;
  status: GroupStatus;
  startDate: string;
  endDate: string | null;
  telegramLink: string | null;
  instagramLink: string | null;
}

export interface GroupMemberDto {
  id: string;
  groupId: string;
  studentId: string;
  status: GroupMembershipStatus;
  totalAmount: number;
  joinedAt: string;
  removedAt: string | null;
  removedReason: string | null;
}

export interface ScheduleEntryDto {
  id: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string | null;
}

export interface InsuranceDto {
  id: string;
  teacherId: string;
  insuredAt: string;
  expiresAt: string;
  phone: string;
  fullName: string;
  carBrand: string;
  plateNumber: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaymentTransactionDto {
  id: string;
  groupStudentId: string;
  amount: number;
  method: PaymentMethod;
  recordedById: string;
  note: string | null;
  paidAt: string;
}

export interface StudentTransferDto {
  id: string;
  teacherId: string;
  direction: TransferDirection;
  branchName: string;
  date: string;
  note: string | null;
  createdAt: string;
  groupStudentId: string;
  student: {
    id: string;
    fullName: string;
    phone: string;
  };
  group: {
    id: string;
    name: string;
    category: string;
    startDate: string;
    endDate: string | null;
    totalAmount: number;
  };
}

export interface CashflowEntryDto {
  id: string;
  teacherId: string;
  type: CashflowType;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface PeriodCounts {
  day: number;
  week: number;
  month: number;
  year: number;
}

export interface StatsOverviewDto {
  studentsJoined: PeriodCounts;
  paymentsTotal: PeriodCounts;
  transfersGiven: PeriodCounts;
  transfersReceived: PeriodCounts;
  cashIncome: PeriodCounts;
  cashExpense: PeriodCounts;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto extends AuthTokensDto {
  user: UserDto;
}

export interface AdminStatsDto {
  totalTeachers: number;
  totalStudents: number;
  newTeachers: PeriodCounts;
  newStudents: PeriodCounts;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
