// deffered media for video rendering by template
if (!customElements.get('login-component')) {
  customElements.define('login-component', class LoginComponent extends HTMLElement {
    constructor() {
      super();

      this.btn1 = this.querySelector('[data-target-id="access-element1"]');
      this.btn2 = this.querySelector('[data-target-id="access-element2"]');
      if(!this.btn1 || !this.btn2) return;

      this.btn1.addEventListener('click', this.toggleTargetContainer.bind(this));
      this.btn2.addEventListener('click', this.toggleTargetContainer.bind(this));
      this.errorContainer = document.getElementById('recoveremail-email-error');
      this.successContainer = document.getElementById('recoveremail-email-success');
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

    connectedCallback(){
      this.checkRecoverIdentifier();
    }

    checkRecoverIdentifier(){
      const currentURL = window.location.href;
      const indentifier = currentURL.indexOf('#recover');
      console.log(indentifier);
      if(indentifier == -1) return;
      this.toggleEmailer(true);
      this.togglePass(false);
    }

    toggleTargetContainer(event){
      const passContainer = document.getElementById(this.btn1.dataset.targetId);
      const emailContainer = document.getElementById(this.btn2.dataset.targetId);

      if(event.target === this.btn2){
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
      const emailContainer = document.getElementById(this.btn2.dataset.targetId);
      if(flag){
        emailContainer.classList.add('transit--in');
        emailContainer.classList.remove('transit--out');
      } else{
        emailContainer.classList.add('transit--out');
        emailContainer.classList.remove('transit--in');
      }
    }

    togglePass(flag){
      const passContainer = document.getElementById(this.btn1.dataset.targetId);
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