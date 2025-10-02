import { io } from 'socket.io-client';
import { BACKEND_URL } from "../lib/env"

export const socket = io(BACKEND_URL);