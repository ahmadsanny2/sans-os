import Swal from "sweetalert2"

// Custom styles for popup confirm dialogs (destructive: delete)
const ConfirmSwal = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: "bg-card/95 border border-border/60 rounded-2xl shadow-glass backdrop-blur-md max-w-[380px] p-6 select-none text-foreground",
    title: "text-base font-extrabold tracking-tight text-foreground font-sans block mt-2",
    htmlContainer: "text-xs text-muted-foreground font-semibold leading-relaxed mt-2.5",
    confirmButton: "inline-flex items-center justify-center rounded-xl bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 hover:scale-[1.02] active:scale-95 focus:outline-none shrink-0 ml-2 cursor-pointer",
    cancelButton: "inline-flex items-center justify-center rounded-xl border border-border/80 bg-secondary/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:bg-secondary/60 hover:text-foreground hover:scale-[1.02] active:scale-95 focus:outline-none shrink-0 cursor-pointer",
    actions: "flex justify-end mt-4 border-t border-border/30 pt-3.5 w-full",
  }
})

// Custom styles for standard error/info dialogs
const ErrorSwal = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup: "bg-card/95 border border-border/60 rounded-2xl shadow-glass backdrop-blur-md max-w-[380px] p-6 select-none text-foreground",
    title: "text-base font-extrabold tracking-tight text-foreground font-sans block mt-2",
    htmlContainer: "text-xs text-muted-foreground font-semibold leading-relaxed mt-2.5",
    confirmButton: "inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:scale-[1.02] active:scale-95 focus:outline-none shrink-0 cursor-pointer",
    actions: "flex justify-end mt-4 border-t border-border/30 pt-3.5 w-full",
  }
})

// Custom styles for toast notifications
const ToastSwal = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: {
    popup: "!bg-card/90 !border !border-border/60 !rounded-xl !shadow-glass !backdrop-blur-md select-none",
    title: "!text-xs !font-bold !text-foreground !font-sans",
    timerProgressBar: "!bg-primary/70",
  }
})

export async function confirmDestructive(title: string, text: string): Promise<boolean> {
  const result = await ConfirmSwal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    iconColor: "#ef4444",
  })
  return result.isConfirmed
}

export async function showError(title: string, text: string): Promise<void> {
  await ErrorSwal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "Close",
    iconColor: "#f43f5e",
  })
}

export function showSuccessToast(title: string): void {
  ToastSwal.fire({
    title,
    icon: "success",
    iconColor: "#10b981",
  })
}

export function showErrorToast(title: string): void {
  ToastSwal.fire({
    title,
    icon: "error",
    iconColor: "#ef4444",
  })
}
