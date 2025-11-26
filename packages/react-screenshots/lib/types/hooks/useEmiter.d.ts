import { EmiterListener } from '../types';
export interface EmiterDispatcher {
    on: (event: string, listener: EmiterListener) => void;
    off: (event: string, listener: EmiterListener) => void;
    emit: (event: string, ...args: unknown[]) => void;
    reset: () => void;
}
export default function useEmiter(): EmiterDispatcher;
