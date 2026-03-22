import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const MODERATION_ACTIONS = [
  'APPROVE',
  'REJECT',
  'REQUEST_CHANGES',
  'ESCALATE',
] as const;

export type ModerationActionType = (typeof MODERATION_ACTIONS)[number];

export class TakeActionDto {
  @IsString()
  @IsIn(MODERATION_ACTIONS)
  action: ModerationActionType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
