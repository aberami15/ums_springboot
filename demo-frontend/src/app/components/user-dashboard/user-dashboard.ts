import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { WebSocketService } from '../../services/websocket';
import { UserService, User, UpdateProfileRequest } from '../../services/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css']
})
export class UserDashboard implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm!: FormGroup;
  submitted = false;
  isLoading = false;
  showEditModal = false;
  photoPreview: string | null = null;
  totalUserCount = 0;

  // ViewChild for file input access
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // WebSocket subscriptions
  private userCountSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  maxLengths = {
    fullname: 250,
    email: 100,
    password: 50
  };

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
    this.loadInitialUserCount();
    // Wait a bit for initial data to load before connecting WebSocket
    setTimeout(() => {
      this.connectWebsocket();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.userCountSubscription) {
      this.userCountSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    this.webSocketService.disconnect();
  }

  private loadInitialUserCount(): void {
    this.userService.getUserCount().subscribe({
      next: (response) => {
        this.totalUserCount = response.count;
        console.log('Initial user count loaded:', this.totalUserCount);
      },
      error: (error) => {
        console.error('Failed to load initial user count:', error);
      }
    });
  }

  private connectWebsocket(): void {
    console.log('Connecting to WebSocket...');
    this.webSocketService.connect();

    // Subscribe to user count updates
    this.userCountSubscription = this.webSocketService.userCount$.subscribe(count => {
      console.log('Received user count update:', count);
      if (count > 0) {
        console.log('Updating count from', this.totalUserCount, 'to', count);
        this.totalUserCount = count;

        // Force Angular change detection
        this.cdr.detectChanges();

        // Add pulse animation to badge
        this.animateCountBadge();

        console.log('Count updated and change detected');
      }
    });

    // Subscribe to notifications
    this.notificationSubscription = this.webSocketService.notification$.subscribe(message => {
      console.log('Received notification:', message);
      if (message) {
        // Transform the notification message
        let displayMessage = message;

        if (message.includes('New user created:')) {
          displayMessage = 'A new user has been created';
        } else if (message.includes('User deleted:')) {
          displayMessage = 'A user has been deleted';
        } else if (message.includes('User updated:')) {
          displayMessage = 'A user has been updated';
        }

        this.showToast(displayMessage, 'info');
      }
    });

    console.log('WebSocket subscriptions established');
  }

  private animateCountBadge(): void {
    const badge = document.querySelector('.user-count-badge');
    if (badge) {
      badge.classList.add('updated');
      setTimeout(() => {
        badge.classList.remove('updated');
      }, 300);
    }
  }

  initForm(): void {
    this.profileForm = this.formBuilder.group({
      fullname: ['', [
        Validators.required,
        Validators.maxLength(this.maxLengths.fullname)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(this.maxLengths.email)
      ]],
      gender: ['', Validators.required],
      profilePhoto: [''],
      currentPassword: [''],
      newPassword: ['', [
        Validators.minLength(6),
        Validators.maxLength(this.maxLengths.password)
      ]],
      confirmNewPassword: ['']
    });
  }

  loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          fullname: user.fullname,
          email: user.email,
          gender: user.gender,
          profilePhoto: user.profilePhoto || ''
        });
      },
      error: (error) => {
        this.showToast('Failed to load user data', 'error');
      }
    });
  }

  openEditModal(): void {
    this.showEditModal = true;
    this.submitted = false;
    this.photoPreview = this.currentUser?.profilePhoto || null;

    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });

    this.resetFileInput();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.profileForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    this.photoPreview = null;
    this.resetFileInput();
  }

  resetForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        fullname: this.currentUser.fullname,
        email: this.currentUser.email,
        gender: this.currentUser.gender,
        profilePhoto: this.currentUser.profilePhoto || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
      this.photoPreview = this.currentUser.profilePhoto || null;
      this.submitted = false;
      this.resetFileInput();
    }
  }

  onPhotoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image size should be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.profileForm.patchValue({ profilePhoto: e.target.result });
        this.profileForm.get('profilePhoto')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.profileForm.patchValue({ profilePhoto: '' });
    this.profileForm.get('profilePhoto')?.markAsDirty();
    this.resetFileInput();
  }

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.profileForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const currentPassword = this.profileForm.value.currentPassword;
    const newPassword = this.profileForm.value.newPassword;
    const confirmNewPassword = this.profileForm.value.confirmNewPassword;

    if (newPassword || confirmNewPassword || currentPassword) {
      if (!currentPassword) {
        this.showToast('Current password is required to change password', 'error');
        return;
      }
      if (!newPassword) {
        this.showToast('New password is required', 'error');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        this.showToast('New passwords do not match', 'error');
        return;
      }
      if (newPassword.length < 6) {
        this.showToast('New password must be at least 6 characters', 'error');
        return;
      }
    }

    this.isLoading = true;
    const request: UpdateProfileRequest = {
      fullname: this.profileForm.value.fullname,
      email: this.profileForm.value.email,
      gender: this.profileForm.value.gender,
      profilePhoto: this.profileForm.value.profilePhoto || undefined
    };

    if (newPassword) {
      request.currentPassword = currentPassword;
      request.newPassword = newPassword;
    }

    this.userService.updateProfile(request).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.currentUser = user;
        this.showToast('Profile updated successfully', 'success');
        this.closeEditModal();
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast(error.error?.message || 'Failed to update profile', 'error');
      }
    });
  }

  passwordsMatch(): boolean {
    const newPassword = this.profileForm.value.newPassword;
    const confirmNewPassword = this.profileForm.value.confirmNewPassword;
    return newPassword === confirmNewPassword && newPassword !== '';
  }

  passwordsDontMatch(): boolean {
    const newPassword = this.profileForm.value.newPassword;
    const confirmNewPassword = this.profileForm.value.confirmNewPassword;
    return confirmNewPassword !== '' && newPassword !== confirmNewPassword;
  }

  isChangingPassword(): boolean {
    const currentPassword = this.profileForm.value.currentPassword;
    const newPassword = this.profileForm.value.newPassword;
    const confirmNewPassword = this.profileForm.value.confirmNewPassword;
    return !!(currentPassword || newPassword || confirmNewPassword);
  }

  getCharCount(controlName: string): number {
    return this.profileForm.get(controlName)?.value?.length || 0;
  }

  getMaxLength(controlName: string): number {
    return this.maxLengths[controlName as keyof typeof this.maxLengths] || 0;
  }

  logout(): void {
    this.webSocketService.disconnect();
    this.authService.logout();
  }

  showToast(message: string, type: 'success' | 'error' | 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  get f() {
    return this.profileForm.controls;
  }
}
