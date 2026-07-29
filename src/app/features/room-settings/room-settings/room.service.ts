import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  private baseUrl = environment.apiUrl + '/rooms';

  constructor(private http: HttpClient) {}

  getRoomById(roomId: string) {
    return this.http.get(`${this.baseUrl}/${roomId}`);
  }

  updateRoom(roomId: string, data: FormData) {
    return this.http.patch(`${this.baseUrl}/${roomId}`, data);
  }
}
