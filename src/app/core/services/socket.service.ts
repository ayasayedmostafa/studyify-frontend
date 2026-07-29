import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });

    // 🔍 تشخيص مؤقت: لو الاتصال فشل (مثلاً بسبب الكوكيز)، هيظهر popup واضح
    // على الشاشة نفسها بدل ما يختفي بصمت. ممكن نشيله بعد ما نتأكد من السبب.
    this.socket.on('connect_error', (err) => {
      alert('فشل الاتصال بالشات: ' + err.message);
    });
  }

  // ─── Room Actions ─────────────────────────────────────────────────────────────

  joinRoom(roomId: string): void {
    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.socket.emit('room:leave', { roomId });
  }

  // ─── Room Member Event Listeners ──────────────────────────────────────────────

  onMemberJoined(callback: (data: { user: any }) => void): void {
    this.socket.on('room:member-joined', callback);
  }

  onMemberLeft(callback: (data: { userId: string; name?: string }) => void): void {
    this.socket.on('room:member-leaved', callback);
  }

  onKicked(callback: (data: { userId: string; name?: string }) => void): void {
    this.socket.on('room:kicked', callback);
  }

  removeRoomListeners(): void {
    this.socket.off('room:member-joined');
    this.socket.off('room:member-leaved');
    this.socket.off('room:kicked');
  }

  onRoomApproved(callback: (data: { roomId: string }) => void): void {
    this.socket.on('room:approved', callback);
  }

  removeRoomApprovedListener(): void {
    this.socket.off('room:approved');
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────────

  sendMessage(data: { roomId: string; content: string }): void {
    this.socket.emit('room:message', data);
  }

  getMessages(callback: (msg: any) => void): void {
    this.socket.on('room:message', callback);
  }

  removeMessagesListener(): void {
    this.socket.off('room:message');
  }

  // ─── Error Listener ───────────────────────────────────────────────────────────

  onError(callback: (err: any) => void): void {
    this.socket.on('app:error', callback);
  }

  // ─── Notifications ────────────────────────────────────────────────────────────

  onNewNotification(callback: (data: { notification: any }) => void): void {
    this.socket.on('notification:new', callback);
  }

  removeNotificationListener(): void {
    this.socket.off('notification:new');
  }

  // ─── Friendship ───────────────────────────────────────────────────────────────

  onFriendRequest(callback: (data: any) => void): void {
    this.socket.on('friend:request', callback);
  }

  onFriendAccepted(callback: (data: any) => void): void {
    this.socket.on('friend:accepted', callback);
  }

  removeFriendshipListeners(): void {
    this.socket.off('friend:request');
    this.socket.off('friend:accepted');
  }
}
