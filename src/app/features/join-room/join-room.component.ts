import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { RoomService } from '../../core/services/room.service';
import { Room } from '../../core/models/room.model';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent, FooterComponent],
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss'],
})
export class JoinRoomComponent implements OnInit {
  joinForm!: FormGroup;
  isLoading = false;
  showAdminNotice = false;
  errorMessage = '';

  /** Set when the user arrived here by clicking "Join" on a specific room card */
  private preselectedRoomId: string | null = null;
  private preselectedRoom: Room | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private roomService: RoomService,
  ) {}

  ngOnInit(): void {
    this.joinForm = this.fb.group({
      roomCode: ['', [Validators.required, Validators.minLength(3)]],
      password: [''],
    });

    // Case 1: user clicked "Join" on a room card in all-rooms -> roomId comes in the URL
    this.preselectedRoomId = this.route.snapshot.queryParamMap.get('room');

    if (this.preselectedRoomId) {
      this.roomService.getRoomById(this.preselectedRoomId).subscribe({
        next: (res) => {
          this.preselectedRoom = res.data.room;
          // lock the code field with the room name so the user knows which room they're joining
          this.joinForm.patchValue({ roomCode: this.preselectedRoom.name });
          this.joinForm.get('roomCode')!.disable();
          this.showAdminNotice = this.preselectedRoom.privacyType === 'private_request';
        },
        error: () => {
          this.errorMessage = 'Room not found.';
        },
      });
    } else {
      // Case 2: user typed a room code/name manually -> we check it live as they type
      this.joinForm.get('roomCode')!.valueChanges.subscribe((val: string) => {
        if (!val || val.trim().length < 3) {
          this.showAdminNotice = false;
          return;
        }
        this.roomService.getRooms({ search: val.trim(), limit: 1 }).subscribe({
          next: (res) => {
            const match = res.data?.[0];
            this.showAdminNotice = !!match && match.privacyType === 'private_request';
          },
          error: () => {
            this.showAdminNotice = false;
          },
        });
      });
    }
  }

  get roomCodeCtrl() { return this.joinForm.get('roomCode')!; }
  get passwordCtrl() { return this.joinForm.get('password')!; }

  onSubmit(): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    const password = this.passwordCtrl.value || undefined;

    if (this.preselectedRoomId) {
      // Case 1: we already know exactly which room to join
      this.joinRoom(this.preselectedRoomId, password, this.preselectedRoom);
      return;
    }

    // Case 2: resolve the typed code/name to a real room first
    const typed = this.roomCodeCtrl.value.trim();
    this.roomService.getRooms({ search: typed, limit: 1 }).subscribe({
      next: (res) => {
        const room = res.data?.[0];
        if (!room) {
          this.isLoading = false;
          this.errorMessage = 'No room found with this code or name.';
          return;
        }
        this.joinRoom(room._id, password, room);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Something went wrong while searching for this room.';
      },
    });
  }

  private joinRoom(roomId: string, password: string | undefined, room: Room | null): void {
    this.roomService.joinRoom(roomId, password).subscribe({
      next: () => {
        this.isLoading = false;
        // private_request rooms need owner approval -> pending screen
        // public / private_password rooms join immediately -> go straight in
        if (room?.privacyType === 'private_request') {
          this.router.navigate(['/request-sent']);
        } else {
          this.router.navigate(['/rooms', roomId]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Could not join this room. Check the code/password and try again.';
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/rooms']);
  }
}
