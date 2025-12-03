import {Component, OnInit, ViewChild, ElementRef, OnDestroy, NgZone} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { WebSocketService } from '../../services/websocket';
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '../../services/user';
import { Router } from '@angular/router';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit, OnDestroy {
  // Data variables
  users: User[] = [];
  currentUser: User | null = null;
  selectedUser: User | null = null;
  adminCount = 0;
  totalUserCount = 0;

  // Modal visibility flags
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showDowngradeModal = false;

  // Form variables
  createForm!: FormGroup;
  editForm!: FormGroup;
  submitted = false;
  isLoading = false;

  // Photo preview variables
  @ViewChild('createFileInput') createFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editFileInput') editFileInput!: ElementRef<HTMLInputElement>;

  createPhotoPreview: string | null = null;
  editPhotoPreview: string | null = null;

  // WebSocket subscriptions
  private userCountSubscription?: Subscription;
  private notificationSubscription?: Subscription;

  //Character Limits
  maxLengths = {
    username: 50,
    password: 50,
    fullname: 250,
    email: 100
  };

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadCurrentUser();
    this.loadUsers();
    this.loadAdminCount();
    this.loadInitialUserCount();
    this.connectWebsocket();
  }

  ngOnDestroy(): void {
    if (this.userCountSubscription) {
      this.userCountSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
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

  private connectWebsocket() {
    console.log('Connecting WebSocket...');
    this.webSocketService.connect();

    // Subscribe to user count updates
    this.userCountSubscription = this.webSocketService.userCount$.subscribe(count => {
      if (count > 0) {
        this.ngZone.run(() => {
          console.log('User count update received:', count);
          console.log('Previous count:', this.totalUserCount);
          console.log('New count:', count);

          this.totalUserCount = count;

          // Auto-reload user list when count changes
          console.log('Reloading user list...');
          this.loadUsers();
          this.loadAdminCount();

          setTimeout(() => {
            this.animateCountBadge();
          }, 0);
        });
      }
    });

    // Subscribe to notifications
    this.notificationSubscription = this.webSocketService.notification$.subscribe(message => {
      if (message) {
        this.ngZone.run(() => {
          console.log('Notification received:', message);
          this.showToast(message, 'info');

          // Force reload users list
          console.log('Force reloading users after notification...');
          this.loadUsers();
          this.loadAdminCount();
        });
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

  initForms(): void {
    this.createForm = this.formBuilder.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(this.maxLengths.username),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(this.maxLengths.password)
      ]],
      confirmPassword: ['', [Validators.required]],
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
      role: ['USER', Validators.required],
      profilePhoto: ['']
    });

    this.editForm = this.formBuilder.group({
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
      role: ['', Validators.required],
      profilePhoto: [''],
      newPassword: ['', [
        Validators.minLength(6),
        Validators.maxLength(this.maxLengths.password)
      ]],
      confirmNewPassword: ['']
    });
  }

  loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        this.showToast('Failed to load user data', 'error');
      }
    });
  }

  loadUsers(): void {
    console.log('Loading users from API...');
    this.userService.getAllUsers().subscribe({
      next: (response: any) => {
        console.log('Received response:', response);
        if (response.status === '00') {
          this.users = response.data;
          this.totalUserCount = response.data.length;
          console.log('Users loaded successfully. Count:', this.totalUserCount);
          console.log('Users:', this.users.map(u => u.username).join(', '));
        } else {
          console.error('API returned error:', response.description);
          this.showToast(response.description || 'Failed to load users', 'error');
        }
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.showToast('Failed to load users', 'error');
      }
    });
  }

  loadAdminCount(): void {
    this.userService.getAdminCount().subscribe({
      next: (response: any) => {
        if (response.status === '00') {
          this.adminCount = response.data;
          console.log('Admin count loaded:', this.adminCount);
        }
      }
    });
  }

  // ========== CREATE USER MODAL FUNCTIONS ==========

  openCreateModal(): void {
    this.showCreateModal = true;
    this.submitted = false;
    this.createForm.reset({ role: 'USER' });
    this.createPhotoPreview = null;
    this.resetFileInput('create');
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm.reset();
    this.createPhotoPreview = null;
    this.resetFileInput('create');
  }

  resetCreateForm(): void {
    this.createForm.reset({ role: 'USER' });
    this.submitted = false;
    this.createPhotoPreview = null;
    this.resetFileInput('create');
  }

  onCreatePhotoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image size should be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.createPhotoPreview = e.target.result;
        this.createForm.patchValue({ profilePhoto: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  removeCreatePhoto(): void {
    this.createPhotoPreview = null;
    this.createForm.patchValue({ profilePhoto: '' });
    this.resetFileInput('create');
  }

  triggerCreateFileInput(): void {
    if (this.createFileInput) {
      this.createFileInput.nativeElement.click();
    }
  }

  // ========== EDIT USER MODAL FUNCTIONS ==========

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.showEditModal = true;
    this.submitted = false;
    this.editPhotoPreview = user.profilePhoto || null;

    this.editForm.patchValue({
      fullname: user.fullname,
      email: user.email,
      gender: user.gender,
      role: user.role,
      profilePhoto: user.profilePhoto || '',
      newPassword: '',
      confirmNewPassword: ''
    });

    this.resetFileInput('edit');
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm.reset();
    this.editPhotoPreview = null;
    this.resetFileInput('edit');
  }

  resetEditForm(): void {
    if (this.selectedUser) {
      this.editForm.patchValue({
        fullname: this.selectedUser.fullname,
        email: this.selectedUser.email,
        gender: this.selectedUser.gender,
        role: this.selectedUser.role,
        profilePhoto: this.selectedUser.profilePhoto || '',
        newPassword: '',
        confirmNewPassword: ''
      });
      this.editPhotoPreview = this.selectedUser.profilePhoto || null;
      this.submitted = false;
      this.resetFileInput('edit');
    }
  }

  onEditPhotoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image size should be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editPhotoPreview = e.target.result;
        this.editForm.patchValue({ profilePhoto: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  }

  removeEditPhoto(): void {
    this.editPhotoPreview = null;
    this.editForm.patchValue({ profilePhoto: '' });
    this.resetFileInput('edit');
  }

  triggerEditFileInput(): void {
    if (this.editFileInput) {
      this.editFileInput.nativeElement.click();
    }
  }

  private resetFileInput(type: 'create' | 'edit'): void {
    if (type === 'create' && this.createFileInput) {
      this.createFileInput.nativeElement.value = '';
    } else if (type === 'edit' && this.editFileInput) {
      this.editFileInput.nativeElement.value = '';
    }
  }

  onEditSubmit(): void {
    this.submitted = true;

    if (this.editForm.invalid || !this.selectedUser) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const newPassword = this.editForm.value.newPassword;
    const confirmNewPassword = this.editForm.value.confirmNewPassword;

    if (newPassword && newPassword !== confirmNewPassword) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    this.isLoading = true;

    const request: UpdateUserRequest = {
      username: this.selectedUser.username,
      fullname: this.editForm.value.fullname,
      email: this.editForm.value.email,
      gender: this.editForm.value.gender,
      role: this.editForm.value.role,
      profilePhoto: this.editForm.value.profilePhoto
    };

    if (newPassword) {
      request.newPassword = newPassword;
    }

    this.userService.updateUser(request).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === '00') {
          this.showToast(response.description || 'User updated successfully', 'success');
          this.closeEditModal();
          this.loadUsers();
          this.loadAdminCount();

          if (this.selectedUser?.username === this.currentUser?.username) {
            this.loadCurrentUser();
          }
        } else {
          this.showToast(response.description || 'Failed to update user', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('Failed to update user', 'error');
      }
    });
  }

  onCreateSubmit(): void {
    this.submitted = true;

    if (this.createForm.invalid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const password = this.createForm.value.password;
    const confirmPassword = this.createForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.showToast('Passwords do not match', 'error');
      return;
    }

    this.isLoading = true;

    const request: CreateUserRequest = {
      username: this.createForm.value.username,
      password: this.createForm.value.password,
      fullname: this.createForm.value.fullname,
      email: this.createForm.value.email,
      gender: this.createForm.value.gender,
      role: this.createForm.value.role,
      profilePhoto: this.createForm.value.profilePhoto
    };

    this.userService.createUser(request).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === '00') {
          this.showToast(response.description || 'User created successfully', 'success');
          this.closeCreateModal();
          this.loadUsers();
          this.loadAdminCount();
        } else {
          this.showToast(response.description || 'Failed to create user', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('Failed to create user', 'error');
      }
    });
  }

  // ========== DELETE USER MODAL FUNCTIONS ==========

  openDeleteModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;

    this.isLoading = true;
    this.userService.deleteUser(this.selectedUser.username).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === '00') {
          this.showToast(response.description || 'User deleted successfully', 'success');
          this.closeDeleteModal();
          this.loadUsers();
          this.loadAdminCount();
        } else {
          this.showToast(response.description || 'Failed to delete user', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('Failed to delete user', 'error');
      }
    });
  }

  // ========== DOWNGRADE ADMIN MODAL FUNCTIONS ==========

  openDowngradeModal(): void {
    this.showDowngradeModal = true;
  }

  closeDowngradeModal(): void {
    this.showDowngradeModal = false;
  }

  confirmDowngrade(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.userService.downgradeAdmin(this.currentUser.username).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === '00') {
          this.showToast(response.description || 'Account downgraded successfully. Redirecting...', 'success');
          setTimeout(() => {
            this.authService.logout();
          }, 1500);
        } else {
          this.showToast(response.description || 'Failed to downgrade account', 'error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showToast('Failed to downgrade account', 'error');
      }
    });
  }

  // ========== HELPER FUNCTIONS ==========

  passwordsMatch(formType: 'create' | 'edit'): boolean {
    if (formType === 'create') {
      const password = this.createForm.value.password;
      const confirmPassword = this.createForm.value.confirmPassword;
      return password === confirmPassword && password !== '';
    } else {
      const newPassword = this.editForm.value.newPassword;
      const confirmNewPassword = this.editForm.value.confirmNewPassword;
      return newPassword === confirmNewPassword && newPassword !== '';
    }
  }

  passwordsDontMatch(formType: 'create' | 'edit'): boolean {
    if (formType === 'create') {
      const password = this.createForm.value.password;
      const confirmPassword = this.createForm.value.confirmPassword;
      return confirmPassword !== '' && password !== confirmPassword;
    } else {
      const newPassword = this.editForm.value.newPassword;
      const confirmNewPassword = this.editForm.value.confirmNewPassword;
      return confirmNewPassword !== '' && newPassword !== confirmNewPassword;
    }
  }

  getCharCount(controlName: string, formType: 'create' | 'edit'): number {
    const form = formType === 'create' ? this.createForm : this.editForm;
    return form.get(controlName)?.value?.length || 0;
  }

  getMaxLength(controlName: string): number {
    return this.maxLengths[controlName as keyof typeof this.maxLengths] || 0;
  }

  canDowngrade(): boolean {
    return this.adminCount > 1;
  }

  isCurrentUser(user: User): boolean {
    return user.username === this.currentUser?.username;
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

  get cf() { return this.createForm.controls; }
  get ef() { return this.editForm.controls; }
}
