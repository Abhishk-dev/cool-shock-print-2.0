// deffered media for video rendering by template
if (!customElements.get('password-component')) {
  customElements.define('password-component', class PasswordComponent extends HTMLElement {
    constructor() {
      super();

      this.passButton = this.querySelector('[data-target-id="access-password"]');
      this.emailButton = this.querySelector('[data-target-id="access-email"]');
      if(!this.passButton || !this.emailButton) return;

      this.passButton.addEventListener('click', this.toggleTargetContainer.bind(this));
      this.emailButton.addEventListener('click', this.toggleTargetContainer.bind(this));
      this.errorContainer = document.getElementById('PasswordLoginForm-password-error');
      this.successContainer = document.getElementById('PasswordLoginForm-email-success');
      if(this.successContainer){
        this.toggleEmailer(true);
        this.togglePass(false);
      } else{
        if(this.errorContainer){
          this.toggleEmailer(false);
          this.togglePass(true);
        }
      }
    }

    toggleTargetContainer(event){
      const passContainer = document.getElementById(this.passButton.dataset.targetId);
      const emailContainer = document.getElementById(this.emailButton.dataset.targetId);

      if(event.target === this.emailButton){
        this.togglePass(false);
        this.toggleEmailer(true);
        const input = emailContainer.querySelector('input');
        if(!input) return;
        input.focus();
      
      } else{
        this.togglePass(true);
        this.toggleEmailer(false);
        const input = passContainer.querySelector('input');
        if(!input) return;
        input.focus();
      }
    }

    toggleEmailer(flag){
      const emailContainer = document.getElementById(this.emailButton.dataset.targetId);
      if(flag){
        emailContainer.classList.add('transit--in');
        emailContainer.classList.remove('transit--out');
      } else{
        emailContainer.classList.add('transit--out');
        emailContainer.classList.remove('transit--in');
      }
    }

    togglePass(flag){
      const passContainer = document.getElementById(this.passButton.dataset.targetId);
      if(flag){
        passContainer.classList.add('transit--in');
        passContainer.classList.remove('transit--out');
      } else{
        passContainer.classList.add('transit--out');
        passContainer.classList.remove('transit--in');
      }
    }
  });
}