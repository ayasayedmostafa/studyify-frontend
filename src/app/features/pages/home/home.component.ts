import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService, TaskStats, SessionStats, Room } from './home.service';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  taskStats: TaskStats | null = null;
  sessionStats: SessionStats | null = null;
  rooms: Room[] = [];
  loading = true;

  /** بيتحط true لو فشل تحميل الرومات، عشان نوريه رسالة واضحة بدل بيانات وهمية */
  roomsError = false;

  ngOnInit(): void {
    const userId = this.authService['userSubject'].value?._id;

    this.homeService.getTaskStats().subscribe({
      next: (data: TaskStats) => this.taskStats = data,
      error: (err: any) => console.error('Task stats error:', err)
    });

    this.homeService.getSessionStats().subscribe({
      next: (data: SessionStats) => this.sessionStats = data,
      error: (err: any) => console.error('Session stats error:', err)
    });

    if (userId) {
      this.homeService.getMyRooms(userId).subscribe({
        next: (res: any) => {
          this.rooms = res.data.rooms;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Rooms error:', err);
          this.rooms = [];
          this.roomsError = true;
          this.loading = false;
        }
      });
    } else {
      this.rooms = [];
      this.loading = false;
    }
  }

  goToRooms(): void {
    this.router.navigate(['/rooms']);
  }

  goToJoinRoom(): void {
    this.router.navigate(['/rooms/join']);
  }

  enterRoom(roomId: string): void {
    this.router.navigate(['/rooms', roomId]);
  }
}
