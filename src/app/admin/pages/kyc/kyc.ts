import { Component, inject, OnInit, forwardRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { AdminKycState } from './state/admin-kyc.state';
import { GetPendingKycs, ReviewKyc } from './state/admin-kyc.actions';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';

@Component({
  selector: 'app-kyc',
  imports: [CommonModule, FormsModule, forwardRef(() => SafeUrlPipe)],
  templateUrl: './kyc.html',
  styleUrl: './kyc.css',
})
export class Kyc implements OnInit {

  private store = inject(Store);
  private kycService = inject(KycService);

  pendingKycs$ = this.store.select(AdminKycState.list);
  loading$ = this.store.select(AdminKycState.loading);
  selectedDocUrl: any = null; // Holds the { url: "..." } object
  filteredKycs$ = this.pendingKycs$.pipe(
    map((res: any) => {
      const items = res?.data || [];
      if (!this.searchQuery) return items;

      const q = this.searchQuery.toLowerCase();
      return items.filter((item: any) =>
        item.user?.email?.toLowerCase().includes(q) ||
        item.user_id.toLowerCase().includes(q)
      );
    })
  );


  selectedUser: any = null;
  isLightboxOpen = false;
  showRejectionInput = false;
  rejectionReason = '';
  searchQuery = '';

 openReview(item: any) {
  this.selectedUser = item;
  this.selectedDocUrl = null; // Reset previous doc while loading new one
  this.showRejectionInput = false;

  const path = item.documents[0]?.document_url;
  if (path) {
    this.kycService.getDocumentUrl(path).subscribe({
      next: (res) => {
        this.selectedDocUrl = res; // res should be { url: "..." }
      },
      error: (err) => console.error('Error fetching signed URL', err)
    });
  }}

  getFileType(url: string | null): 'image' | 'pdf' | 'other' {
    if (!url) return 'other';
    
    // Supabase signed URLs look like: .../file.pdf?token=xyz
    // We split by '?' to get the file path, then get the extension
    const pathWithoutQuery = url.split('?')[0];
    const ext = pathWithoutQuery.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext!)) return 'image';
    if (ext === 'pdf') return 'pdf';
    
    return 'other';
  }

  handleReview(decision: 'approved' | 'rejected') {
    if (!this.selectedUser) return;

    if (decision === 'rejected' && !this.showRejectionInput) {
      this.showRejectionInput = true;
      return;
    }

    this.store.dispatch(new ReviewKyc(
      this.selectedUser.id,
      decision,
      decision === 'rejected' ? this.rejectionReason : undefined
    )).subscribe(() => {
      this.selectedUser = null;
    });
  }

  getInitials(email: string): string {
    if (!email) return '??';
    return email.substring(0, 2).toUpperCase();
  }



  getDocUrl(path: string) {
    // IMPORTANT: If your bucket is PUBLIC, use /public/
    // If it is PRIVATE, this URL will not work without a ?token=... from the backend
    return `https://bswhlzqnuccefgexlbfb.supabase.co/storage/v1/object/public/kyc-documents/${path}`;
  }

  ngOnInit(): void {
    this.store.dispatch(new GetPendingKycs());
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { KycService } from '../../../core/services/kyc.service';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }
  transform(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}