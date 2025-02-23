
export type ChatRole = 'user' | 'assistant' | 'system';

export interface CreateChatCompletionRequestMessage {
  role: ChatRole;
  content: string;
}
