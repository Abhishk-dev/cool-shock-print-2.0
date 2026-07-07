function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  const elements = getFocusableElements(container);
  const first = elements[0];
  const last = elements[elements.length - 1];
  removeTrapFocus();
  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    ) {
      return;
    }
    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };
  trapFocusHandlers.focusout = () => document.removeEventListener('keydown', trapFocusHandlers.keydown);
  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }
    // On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
    // **Added Condition**: If no other conditions matched, keep focus in the container
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);
  elementToFocus.focus();
  if (
    elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);
  if (elementToFocus) elementToFocus.focus();
}
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

function pauseElementBasedMedia(element) {
  element.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  element.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  element.querySelectorAll('video').forEach((video) => video.pause());
  element.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}
Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};
Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};
Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};
Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};
Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};
Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

function validation() {
  let email = document.querySelectorAll('[name="contact[email]"]');
  let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  
  email.forEach(input => {
    let text = input.closest('form').querySelector('.results-wrap_message');
    if (input.value.match(pattern)) {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterValidMessage;
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      input.closest('form').querySelector('[type="submit"]').removeAttribute('disabled');
    } else {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterInValidMessage;
      if(text) text.style.color = 'var(--section-error-color)';
      input.classList.add('form-control--error');
      input.closest('form').querySelector('[type="submit"]').setAttribute('disabled', '');
      if (event.keyCode == '13') {
        event.preventDefault();
      }
    }
  
    if (input.value == '') {
      if(text) text.innerHTML = "";
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      input.closest('form').querySelector('[type="submit"]').setAttribute('disabled', '');
    }
  });
}

// Script
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const getJsonParse = (attrStr) => {
  let arr = [];
  const strArr = attrStr ? JSON.parse(attrStr) : null;
  if(!strArr) return arr = null;
  strArr.forEach(selector => arr.push(document.querySelector(selector)));
  return arr;
}

const addHoverOnElement = (element) => {
  if(!element) return;
  element.addEventListener('focusin', () =>{
    element.classList.add('hover');
  });
  element.addEventListener('focusout', () =>{
    element.classList.remove('hover');
  });
}

const togglerLoader = (flag) => {
  const loader = document.querySelector('[data-loader]');
  if(flag) return loader.classList.remove('hidden');
  loader.classList.add('hidden');
}

const onVariantChange = (jsonSelector, optSet, formsSelector, renders, parentSelector, gallerySelectors, sectionId, productUrl, updateUrl, focusSelector, renderMedia, templateSelector) => {
  const json = document.querySelector(jsonSelector);
  if(!json) return;
  const data = JSON.parse(json.textContent);
  const variants = data.variants;
  this.currentVariant = variants.find(variant => variant.options.every((option, index) => option === optSet[index]));
  setStatuses(this.currentVariant, formsSelector, renders, parentSelector);
  if(!this.currentVariant) return;
  if(this.currentVariant.featured_image) setGallery(this.currentVariant.featured_image, gallerySelectors, renderMedia, templateSelector);
  renderVariant(renders, this.currentVariant.id, parentSelector, productUrl, sectionId, updateUrl, focusSelector);
}
window.themeOnVariantChange = onVariantChange;

const setStatuses = (variant, formElems, renderElems, parentElem) => {
  const forms = getJsonParse(formElems);
  forms.forEach(form => {
    const atcBtn = form.querySelector('[name="add"]');
    if(!variant) return toggleAvail(false, renderElems, parentElem, atcBtn);
    toggleAvail(true, renderElems, parentElem);
    const input = form.querySelector('[name="id"]');
    input.value = variant.id;
    if(!atcBtn) return;
    const textContainer = atcBtn.querySelector('[data-atc-text]');
    if(variant.available){
      textContainer.innerText = textContainer.dataset.textAvail;
      atcBtn.removeAttribute('disabled');
      return;
    }
    textContainer.innerText = textContainer.dataset.textSold;
    atcBtn.setAttribute('disabled', '');
  });
}

const toggleAvail = (flag, selectors, parent, btn) => {
  const arr = JSON.parse(selectors);
  const parentElem = document.querySelector(parent);
  arr.forEach(selector => {
    const element = parentElem.querySelector(selector);
    if(!element) return;
    flag ? element.classList.remove('--elem-opac') : element.classList.add('--elem-opac');
  });
  if(!btn) return;
  const textContainer = btn.querySelector('[data-atc-text]');
  textContainer.innerText = textContainer.dataset.textUnavail;
  btn.setAttribute('disabled', '');
}

const renderVariant = (elems, id, parent, url, section, updateUrl, focusSelector) => {
  togglerLoader(true);
  fetch(`${url}?variant=${id}&section_id=${section}`)
    .then((response) => response.text())
    .then((responseText) => {
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      const parentElement = document.querySelector(parent);
      const arr = JSON.parse(elems);
      arr.forEach(selector => {
        const element = parentElement.querySelector(selector);
        if (element && html.querySelector(selector)) element.innerHTML = html.querySelector(selector).innerHTML;
      });
    })
    .catch((e) => {
      console.error(e);
      throw e;
    })
    .finally(() => {
      if(updateUrl === 'true') window.history.replaceState({ }, '', `${url}?variant=${id}`);
      if(focusSelector){
        const focusParent = document.querySelector(focusSelector);
        trapFocus(focusParent.content ? focusParent.content : focusParent);
      }
      if(typeof window.themeAfterVariantRender === 'function') window.themeAfterVariantRender(section);
      togglerLoader(false);
    }
  );
}

const setGallery = (imageId, galleries, render, template) => {
  const arr = JSON.parse(galleries);
  if(render){
    const templateElem = document.querySelector(template);
    const templateElement = templateElem.content.querySelector(`[data-media-id="${imageId}"]`);
    const imageContainer = document.querySelector(arr[0]);
    var currentOpacity = parseFloat(imageContainer.style.opacity) || 1;
    var newOpacity = (currentOpacity === 1) ? 0 : 1;
    imageContainer.style.transition = 'opacity 0.3s ease';
    imageContainer.style.opacity = newOpacity;
    setTimeout(() => {
      imageContainer.innerHTML = templateElement.outerHTML;
      setTimeout(() => {
        imageContainer.style.opacity = 1;
      }, 0);
    }, 500);
    return
  }
  arr.forEach(gallery => {
    const gal = document.querySelector(gallery);
    if(!gal) return;
    switch(gal.slider) {
      case undefined:
        let items = Array.from(gal.querySelectorAll('[data-gal-item]'));
        const activeIndex = items.findIndex(item => item.dataset.mediaId == imageId);
        if(activeIndex === -1 || activeIndex === items[activeIndex]) return;
        items.unshift(items.splice(activeIndex, 1)[0]);
        gal.innerHTML = '';
        gal.classList.add('--swapped');
        gal.append(...items);
        break;
      default:
        const splide = gal.slider;
        const slide = splide.Components.Slides.filter(`[data-media-id="${imageId}"]`);
        splide.go(slide[0].index);
        break;
    }
  });
}

const handleLineError = (parent, response) => {
  const parentElement = document.querySelector(parent);
  const errorContainer = parentElement.querySelector('[data-render-error]');
  errorContainer.classList.remove('hidden');
  errorContainer.innerText = response.errors;
  const qtyInput = parentElement.querySelector('input[name="updates[]"]');
  qtyInput.value = parseFloat(parentElement.dataset.initQty);
  togglerLoader(false);
  return this.erorr = true;
}

const lineItemUpdate = (line, quantity, sections, parent) => {
  togglerLoader(true);
  const secArr = JSON.parse(sections);
  var body = JSON.stringify({
    line,
    quantity,
    sections: secArr.map(section => section.id),
    sections_url: window.location.pathname
  });
  this.erorr = false;
  fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
    .then((response) => {
      return response.text();
    })
    .then((responseText) => {
      const response = JSON.parse(responseText);
      if(response.errors) return handleLineError(parent, response);
      sectionArrRender(secArr, response);
    }).catch((e) => {
      console.error(e);
    })
    .finally(() => {
      if(!this.erorr){
        const modal = document.querySelector('[data-modal="modal-cart-drawer"]');
        if(modal){
          if(modal.classList.contains('modal--active')){
            trapFocus(modal.content);
            modal.setListeners(true);
          }
        }
      }
      togglerLoader(false);
    }
  );
}

const sectionArrRender = (secArr, response) => {
  secArr.forEach(section => {
    const html = new DOMParser() .parseFromString(response.sections[section.id], 'text/html').getElementById(section.id);
    section.selectors.forEach(selector => {
      const targetElement = document.querySelector(selector);
      const sourceElement = html.querySelector(selector);
      if (targetElement && sourceElement) {
        targetElement.outerHTML = sourceElement.outerHTML;
      }
    });
  });
}

const fetchAtc = (sections, config, element) => {
  this.error = true;
  togglerLoader(true);
  atcError(null, element, false);
  fetch(`${routes.cart_add_url}`, config)
    .then((response) => response.json())
    .then((response) => {
      if(!response.sections) return atcError(response, element, true);
      this.error = false;
      sectionArrRender(sections, response);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    })
    .finally(() => {
      resetQty(element.dataset.form);
      togglerLoader(false);
      if(!this.error){
        if(element.dataset.selfModal){
          const toggler = document.querySelector('modal-render-component.modal--active button[data-modal-ref]');
          toggler.dispatchEvent(new Event('click'));
        }
        if(element.dataset.redirect) return window.location.href = element.dataset.redirect;
        if(element.dataset.modal === 'true'){
          const isModal = document.querySelector('[data-modal="modal-cart-drawer"]');
          if(isModal.classList.contains('modal--active')){
            trapFocus(isModal);
          } else{
            const drawerToggler = document.querySelector(element.dataset.modalRef);
            if(drawerToggler) drawerToggler.dispatchEvent(new Event('click'));
          }
        }
        if (element.recipientForm) {
          element.recipientForm.resetRecipientForm();
        }
      }
    }
  );
}

const lineItemUpdateRmover = (line, quantity, secArr, config, element) => {
  this.proceed = false;
  var body = JSON.stringify({
    line,
    quantity
  });
  fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
    .then((response) => {
      return response.text();
    })
    .then((responseText) => {
      this.proceed = true;
    })
    .catch(e => {
      console.error(e);
    })
    .finally(() => {
      if(this.proceed) fetchAtc(secArr, config, element);
    }
  );
}

const atcError = (response, elem, flag) => {
  const errElem = document.querySelector(elem.dataset.errorSelector);
  const errSpan = errElem.querySelector('[data-error]');
  const recepForm = elem.form.querySelector('recipient-form');
  if(!flag){
    errElem.classList.add('hidden');
    errSpan.innerText = '';
    if(recepForm) recepForm.clearErrorMessage();
    return;
  }
  if(recepForm && response.errors) recepForm.displayErrorMessage(null, response.errors);
  if(typeof response.description !== 'object'){
    errElem.classList.remove('hidden');
    errSpan.innerText = response.description;
  }
  resetQty(elem.dataset.form);
}

const resetQty = (elem) => {
  const form = document.querySelector(elem);
  if(!form) return;
  const qtyField = form.quantity;
  qtyField.value = parseFloat(qtyField.min);
  qtyField.dispatchEvent(new Event('input'));
}

const setFilterParam = (param, value, remove = false, getParams = false) => {
  const input = document.getElementById('filters-params');
  const url = new URL(input.value, window.location.origin);
  if(getParams){
    const params = new URLSearchParams(url.searchParams).toString();
    return params;
  }
  switch(remove){
    case true:
      if(param.includes('price')){
        [...url.searchParams.keys()].forEach(key => key.includes('filter.v.price') && url.searchParams.delete(key));
      } else{
        const valToDel = value;
        const values = url.searchParams.getAll(param);
        const updatedValues = values.filter(value => value !== valToDel);
        url.searchParams.delete(param);
        updatedValues.forEach(value => url.searchParams.append(param, value));
      }
      break;
    case 'all':
      [...url.searchParams.keys()].forEach(key => key.includes('filter') && url.searchParams.delete(key));
      break;
    default:
      if(param.includes('price')){
        url.searchParams.set(param, value);
      } else{
        url.searchParams.append(param, value);
      }
      break;
  }
  input.value = url.toString();
}

class AtcSubmit extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(){
    this.form = document.querySelector(this.dataset.form);
    if(!this.form) return;
    this.recipientForm = this.form.querySelector('recipient-form');
    this.submit = this.onAddToCart.bind(this);
    this.form.addEventListener('submit', this.submit);
  }

  onAddToCart(event){
    event.preventDefault();
    this.error = false;
    const secArr = JSON.parse(this.dataset.sections);
    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    const formData = new FormData(this.form);
    formData.append('sections', secArr.map(section => section.id));
    formData.append('sections_url', window.location.pathname);
    config.body = formData;
    fetchAtc(secArr, config, this);
  }
}
if(!customElements.get('atc-submit')) customElements.define('atc-submit', AtcSubmit);

class AtcLineUpdate extends AtcSubmit {
  constructor() {
    super();
  }

  onAddToCart(event){
    event.preventDefault();
    this.error = false;
    const secArr = JSON.parse(this.dataset.sections);
    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    const formData = new FormData(this.form);
    formData.append('sections', secArr.map(section => section.id));
    formData.append('sections_url', window.location.pathname);
    config.body = formData;
    lineItemUpdateRmover(this.dataset.updateLineId, 0, secArr, config, this);
  }
}
if(!customElements.get('atc-line-update')) customElements.define('atc-line-update', AtcLineUpdate);

class QuantityInput extends HTMLElement {
constructor() {
  super();

  const onButtonClick = (event) => {
    event.preventDefault();
    const previousValue = this.input.value;
    (event.target.name === 'plus' || event.target.parentElement.name === 'plus') ? this.input.stepUp() : this.input.stepDown();
    if(previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  const setBtnStatus = (type, value) => {
    const currVal = type === 'min' ? parseInt(this.input.min) : parseInt(this.input.value);
    const btn = type === 'min' ? this.querySelector("button[name='minus']") : this.querySelector("button[name='plus']");
    switch (type) {
      case 'min':
        btn.classList.toggle('disabled', value <= currVal);
        btn.toggleAttribute('disabled', value <= currVal);
        break;
      case 'max':
        btn.classList.toggle('disabled', value >= currVal);
        btn.toggleAttribute('disabled', value >= currVal);
        break;
      default:
        console.log('no button found');
        break;
    }
  }

  const setSubtotals = (qty, elem) => {
    const total = qty * parseInt(this.dataset.variantPrice);
    elem.innerHTML = Shopify.formatMoney(total, window.money_format);
  }

  const onInputChange = () => {
    const value = parseInt(this.input.value);
    const qtySubtotal = this.querySelector('[data-qty-subtotal]');
    (this.input.min && setBtnStatus('min', value), this.input.max && setBtnStatus('max', value));
    if(!qtySubtotal) return;
    setSubtotals(value, qtySubtotal);
  }

  const setListeners = () => {
    this.changeEvent = new Event('input', { bubbles: true });
    this.inputChange = onInputChange.bind(this);
    this.buttonClick = onButtonClick.bind(this);
    this.input.addEventListener('input', this.inputChange);
    this.querySelectorAll('button').forEach(button => button.addEventListener('click', this.buttonClick));
  }

  const initialize = () => {
    this.input = this.querySelector('input');
    if(!this.input) return;
    setListeners();
  }
  initialize();
}
}
if(!customElements.get('quantity-input')) customElements.define('quantity-input', QuantityInput);

class LineItemQty extends QuantityInput {
constructor() {
  super();
}

connectedCallback(){
  this.inputUpdate = this.querySelector('[name="updates[]"]');
  this.debouncedOnUpdate = debounce((event) => {
    this.onLineItemUpdate(event);
  }, 500);
  this.inputUpdate.addEventListener('input', this.debouncedOnUpdate);
}

onLineItemUpdate(){
  const qty = parseInt(this.querySelector('[name="updates[]"]').value);
  lineItemUpdate(this.dataset.lineId, qty, this.dataset.sections, this.dataset.parentSelector);
}
}
if(!customElements.get('line-item-qty')) customElements.define('line-item-qty', LineItemQty);

class DropdownComponent extends HTMLElement {
constructor() {
  super();
  if(this.dataset.desktopHidden === 'true' && screen.width > 767) return;
  if(this.dataset.desktopHidden === 'wide' && screen.width > 991) return;
  this.button = this.querySelector('.dropdown-component_opener');
  this.content = this.querySelector('.dropdown-component_wrapper');
  if(!this.button || !this.content) return;
  this.onButtonClick = this.toggleDropdown.bind(this);
  this.onButtonClose = this.close.bind(this);
  this.onBodyClick = this.onBodyClick.bind(this);
  this.onKeyUp = this.onKeyUp.bind(this);
  this.button.addEventListener('click', this.onButtonClick);
  this.closeButton = this.querySelector('[data-dropdown-close-btn]');
  if(this.closeButton) this.closeButton.addEventListener('click', this.onButtonClose);
  if(this.dataset.onHover === 'true' && screen.width > 1025){
    this.addEventListener('mouseenter', this.onButtonClick);
    this.addEventListener('mouseleave', this.onButtonClose);
  }
}

open(){
  this.button.setAttribute('aria-expanded', true);
  this.content.classList.add('dropdown--open');
  this.content.focus();
  trapFocus(this.content);
  document.body.addEventListener('click', this.onBodyClick);
  this.addEventListener('keyup', this.onKeyUp);
}

close(){
  this.button.setAttribute('aria-expanded', false);
  this.content.classList.remove('dropdown--open');
  removeTrapFocus(this.content);
  document.body.removeEventListener('click', this.onBodyClick);
  this.removeEventListener('keyup', this.onKeyUp);
}

toggleDropdown(event){
  if(event.target.getAttribute('aria-expanded') === 'true') return this.close();
  this.open();
}

onBodyClick(event){
  const target = event.target;
  if(this.contains(target) || target === this || target === this.button
    && this.button.getAttribute('aria-expanded') === 'true') return;
  this.doClose(event);
}

onKeyUp(event){
  if(event.key !== 'Escape') return;
  this.doClose(event);
}

doClose(event){
  if(this.dataset.level === '2'){
    event.stopPropagation();
    this.close();
    this.button.focus();
    const parentDropdown = this.closest('dropdown-component[data-level="1"]');
    if(parentDropdown && parentDropdown.content) trapFocus(parentDropdown.content);
    return;
  }
  this.close();
  this.button.focus();
}
}
if(!customElements.get('dropdown-component')) customElements.define('dropdown-component', DropdownComponent);

class DeferredMedia extends HTMLElement {
constructor() {
  super();
  const poster = this.querySelector('[data-id^="Deferred-Poster-"]');
  if (!poster) return;
  poster.addEventListener('click', this._lc.bind(this));
}

_lc(focus = true) {
  if (!this.getAttribute('loaded')) {
    const content = document.createElement('div');
    content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));
    this.setAttribute('loaded', true);
    const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
    if (focus) deferredElement.focus();
    if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) deferredElement.play();
    if(this.dataset.parent){
      const parentDiv = document.querySelector(this.dataset.parent);
      if (parentDiv) {
        parentDiv.classList.add('video-playing');
      }
    }
    if(!this.dataset.sectionId) return;
    const section = document.getElementById(this.dataset.sectionId);
    section.classList.add('--remove-sliders');
  }
}
}
if(!customElements.get('deferred-media')) customElements.define('deferred-media', DeferredMedia);

class ModalComponentToggler extends HTMLElement {
constructor() {
  super();
  
  if ((this.dataset.desktopHidden && screen.width > 991) || (this.dataset.mobileHidden && screen.width < 768)) return;
  this.button = this.querySelector('button');
  if(!this.button) return;

  const open = (modal) => {
    modal.open(this.button);
    this.button.setAttribute('data-expanded', 'true');
  }

  const toggleModal = (event) => {
    event.preventDefault();
    if(this.dataset.storage === 'true') localStorage.setItem(this.dataset.storageKey, this.dataset.storageValue);
    const modal = document.querySelector(`[data-modal="${this.button.dataset.modalRef}"]`);
    if(this.button.dataset.expanded === 'true') return modal.close();
    open(modal);
  }
  this.button.addEventListener('click', toggleModal.bind(this));
}
}
if(!customElements.get('modal-component-toggler')) customElements.define('modal-component-toggler', ModalComponentToggler);

class ModalComponent extends HTMLElement {
constructor() {
  super();
  
  if ((this.dataset.desktopHidden && screen.width > 991) || (this.dataset.mobileHidden && screen.width < 768)) return;
  this.toggler = null;
  this.parent = null;
  this.content = this.querySelector('.modal-component');
  this.onKeyUp = this.onKeyUp.bind(this);
  this.onBodyClick = this.onBodyClick.bind(this);
}

open(toggler = null){
  this.toggler = toggler;
  this.parent = this.parentElement;
  if(this.dataset.trigger !== 'self') document.body.append(this);
  this.setClasses(true);
  trapFocus(this.content);
  this.setListeners(true);
}

close(){
  if(this.dataset.trigger !== 'self'){
    document.body.removeChild(this);
    if(this.parent) this.parent.append(this);
  }
  this.setClasses(false);
  if(this.toggler){
    this.toggler.setAttribute('data-expanded', 'false');
    removeTrapFocus(this.toggler)
  }
  this.toggler = null;
  this.parent = null;
  this.setListeners(false);
}

setClasses(flag){
  this.classList.toggle('modal--active', flag);
  document.body.classList.toggle(`${this.dataset.modal}--modal-active`, flag);
  document.body.classList.toggle('overflow-hidden', flag);
}

setListeners(flag){
  if(this.dataset.hideOutside === 'false') return;
  switch(flag){
    case true:
      this.addEventListener('keyup', this.onKeyUp);
      this.addEventListener('click', this.onBodyClick);
      break;
    default:
      this.removeEventListener('keyup', this.onKeyUp);
      this.removeEventListener('click', this.onBodyClick);
      break;
  }
}

onBodyClick(event){
  const target = event.target;
  const boundings = this.querySelector('.modal-component_body');
  if(boundings.contains(target) || target === boundings) return;
  this.close();
}

onKeyUp(event){
  if(event.key === 'Escape') this.close();
}
}
if(!customElements.get('modal-component')) customElements.define('modal-component', ModalComponent);

class ModalComponentPopup extends ModalComponent {
  constructor() {
    super();
    const keyExists = localStorage.getItem(this.dataset.storageKey);
    const storageValue = this.dataset.storageValue || null;
    if (keyExists === storageValue) {
      this.remove();
      return;
    }
    this.close();
    if (!window.location.href.includes('challenge') || !this.classList.contains('modal--active')) {
      this.open();
    }
  }
}
if (!customElements.get('modal-component-popup')) customElements.define('modal-component-popup', ModalComponentPopup);

class ModalRenderComponent extends ModalComponent {
  constructor() {
    super();
  }

  open(toggler = null){
    this.toggler = toggler;
    this.parent = this.parentElement;
    document.body.append(this);
    this.setClasses(true);
    this.renderModal();
  }

  close(){
    const parent = this.querySelector(this.dataset.selector);
    parent.innerHTML = '';
    super.close();
  }

  renderModal(){
    togglerLoader(true);
    const fetchUrl = this.dataset.url ? `${this.dataset.url}&section_id=${this.dataset.section}` : `${window.shopUrl}?section_id=${this.dataset.section}`;
    fetch(fetchUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html').querySelector(`#${this.dataset.renderSelector}`);
        const parent = this.querySelector(this.dataset.selector);
        parent.innerHTML = html.innerHTML;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      })
      .finally(() => {
        setTimeout(() => {
          trapFocus(this.content);
          this.setListeners(true);
          this.classList.add('--rendered');
          if(this.dataset.hasXr === 'true'){
            this.querySelectorAll('[id^="QuickProductJSON-"]').forEach((modelJSON) => {
              window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
              modelJSON.remove();
            });
            window.ShopifyXR.setupXRElements();
          }
          togglerLoader(false);
        }, 1000);
      }
    );
  }
}
if(!customElements.get('modal-render-component')) customElements.define('modal-render-component', ModalRenderComponent);

class MarqueeComponent extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback(){
    if(!this.querySelector('.marquee-component_col')) return;
    const setOnMarquee = (pos, cycle) => {
      const speed = parseFloat(this.dataset.speed);
      let cycleCount = cycle;
      let container = this.querySelector('.marquee-component');
      clearInterval(this.init);
      this.init = setInterval(frame.bind(this), speed);
      function frame(){
        if(cycleCount <= 1){
          clearInterval(this.init);
          if(this.dataset.rotation){
            container.style.setProperty('--mrq-top', (0 + 'px'));
            container.style.transform = `translateY(0px)`;
          } else{
            // container.style.setProperty('--mrq-left', (0 + 'px'));
            container.style.transform = `translateX(0px)`;
          }
          this.dataset.direction === 'forward' ? setOnMarquee(this.initBounds * -1, this.initBounds) : setOnMarquee(0, this.initBounds);
          this.pos = pos;
        } else{
          this.dataset.direction === 'forward' ? pos++ : pos--;
          cycleCount--;
          this.pos = pos;
          this.cycleCount = cycleCount;
          if (!isNaN(pos)) {
            if (this.dataset.rotation) {
              // container.style.setProperty('--mrq-top', pos + 'px');
              container.style.transform = `translateY(${pos}px)`;
            } else {
              // container.style.setProperty('--mrq-left', pos + 'px');
              container.style.transform = `translateX(${pos}px)`;
            }
          }
        }
      }
    }
    const setOnPause = () => {
      clearInterval(this.init);
    }
    const setOnResume = () => {
      let pos = this.pos;
      let cycleCount = this.cycleCount;
      if (isNaN(pos) || isNaN(cycleCount)) {
        this.dataset.direction === 'forward'
          ? setOnMarquee(this.initBounds * -1, this.initBounds)
          : setOnMarquee(0, this.initBounds);
        return;
      }
      setOnMarquee(pos, cycleCount);
    };
    const setContainer = (size, container) => {
      if(this.dataset.rotation){
        container.style.height = size + 'px';
        // container.style.setProperty('--mrq-top', ((this.initBounds * -1) + 'px'));
        container.style.transform = `translateY(${this.initBounds * -1}px)`;
      } else{
        container.style.width = size + 'px';
        container.style.transform = `translateX(${this.initBounds * -1}px)`;
        // container.style.setProperty('--mrq-left', ((this.initBounds * -1) + 'px'));
      }
      container.classList.remove('marquee-component--h-scroll', 'marquee-component--v-scroll');
    }
    const setTabIndexing = () => {
      const focusables = this.querySelectorAll('[class*="cloned"] a', '[class*="cloned"] button');
      focusables.forEach(element => {
        element.tabIndex = -1;
        element.setAttribute('aria-hidden', 'true');
      });
    }
    const createClones = () => {
      const wrapper = this.querySelector('.marquee-component');
      this.sizes = getColumnsSize();
      if(this.sizes === 0) return;
      clone(wrapper);
      while(this.sizes < this.mainBounds){
        clone(wrapper);
        createClones();
      }
      setContainer(this.sizes, wrapper);
      setTabIndexing();
    }
    const clone = (wrapper) => {
      const columns = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])');
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedBefore');
        wrapper.insertBefore(clonedColumn, columns[0]);
      }
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedAfter');
        wrapper.appendChild(clonedColumn);
      }
    }
    const getColumnsSize = () => {
      let widths = 0;
      const columns = this.querySelectorAll('.marquee-component_col');
      columns.forEach(column => {
        const bounds = column.getBoundingClientRect();
        widths += this.dataset.rotation ? bounds.height : bounds.width;
      });
      return widths;
    }
    const initialize = () => {
      this.init = null;
      this.columnsCount = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])').length;
      this.initBounds = getColumnsSize() * 2;
      if(this.initBounds === 0) return;
      this.mainBounds = this.dataset.rotation ? this.getBoundingClientRect().height : this.getBoundingClientRect().width;
      createClones();
      this.dataset.direction === 'forward' ? setOnMarquee(this.initBounds * -1, this.initBounds) : setOnMarquee(0, this.initBounds);
    }
    if(this.dataset.pauseOnHover === 'true'){
      this.addEventListener('mouseenter', setOnPause.bind(this));
      this.addEventListener('mouseleave', setOnResume.bind(this));
    }
    this.initLoad = setTimeout(initialize.bind(this), 2000);
    document.addEventListener('DOMContentLoaded', () => this.initLoad);
  }
}
if (!customElements.get('marquee-component')) { customElements.define('marquee-component', MarqueeComponent); }

class AccordionWrapper extends HTMLElement {
constructor() {
  super();
}

connectedCallback(){
  const accordion = (event) => {
    if(this.toggle.parentElement.hasAttribute('open')) keepOpen(event);
    if(!this.toggle.parentElement.hasAttribute('open')) closeOther();
  }

  const closeOther = () => {
    const allRows = document.querySelectorAll(`#${this.dataset.parent} details`);
    allRows.forEach(toggler => {
      if(toggler.querySelector('summary') === this.toggle) return;
      toggler.removeAttribute('open');
    });
  }
  
  const keepOpen = (event) => {
    const toggle = event.target.closest('details');
    toggle.removeAttribute('open');
  }
  
  const hideOutside = (event) => {
    const target = event.target;
    const boundings = this.querySelector('.open-close_slide');
    if (boundings.contains(target) || target === boundings || target.closest('.open-close_slide')) return;
    closeOther();
  }

  this.toggle = this.querySelector('summary');
  if(this.toggle) this.toggle.addEventListener('click', accordion.bind(this));
}
}
if(!customElements.get('accordion-wrapper')) customElements.define('accordion-wrapper', AccordionWrapper);

// tabset
if (!customElements.get('tabset-component')) {
customElements.define('tabset-component', class TabsetComponent extends HTMLElement {
  constructor() {
    super();
    
    this.tablistNode = this;
    this.tabs = Array.from(this.tablistNode.querySelectorAll('[data-tabset-content]'));
    this.initialize();
    if(this.dataset.editorMode === 'true'){
      document.addEventListener('shopify:block:select', function (event) {
        const target = event.target;
        const parent = target.parentElement;
        if(parent.nodeName !== 'TABSET-COMPONENT') return;
        parent.initialize();
        parent.setSelectedTab(target);
      });
    }
  }
  
  initialize(){
    this.tabpanels = this.tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    this.tabs.forEach(tab => {
      tab.tabIndex = -1;
      tab.setAttribute('aria-selected', 'false');
      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));
    });

    this.firstTab = this.tabs[0];
    this.lastTab = this.tabs[this.tabs.length - 1];
    this.setSelectedTab(this.firstTab, false);
  }

  setSelectedTab(currentTab, setFocus = true) {
    this.tabs.forEach((tab, index) => {
      const panel = this.tabpanels[index];
      if (!panel) return;
      const isSelected = currentTab === tab;
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.tabIndex = isSelected ? 0 : -1;
      panel.classList.toggle('hidden', !isSelected);
      if (isSelected && setFocus) {
        tab.focus();
      }
    });
  }

  setSelectedToPreviousTab(currentTab) {
    const index = this.tabs.indexOf(currentTab);
    this.setSelectedTab(index === 0 ? this.lastTab : this.tabs[index - 1]);
  }

  setSelectedToNextTab(currentTab) {
    const index = this.tabs.indexOf(currentTab);
    this.setSelectedTab(index === this.tabs.length - 1 ? this.firstTab : this.tabs[index + 1]);
  }

  onKeydown(event) {
    const tgt = event.currentTarget;
    let flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.setSelectedToPreviousTab(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setSelectedToNextTab(tgt);
        flag = true;
        break;

      case 'Home':
        this.setSelectedTab(this.firstTab);
        flag = true;
        break;

      case 'End':
        this.setSelectedTab(this.lastTab);
        flag = true;
        break;

      default:
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event) {
    this.setSelectedTab(event.currentTarget);
  }
});
}

// sticky block
if (!customElements.get('sticky-block')) {
customElements.define('sticky-block', class StickyBlock extends HTMLElement {
  constructor() {
    super();
    
    if(!this.dataset.refBlock && !this.dataset.behavior) return;
  }
  
  connectedCallback(){
    const stickyHide = () => {
      this.setAttribute('data-revealed', false);
      if(this.dataset.hasHidden === 'true') this.setAttribute('aria-hidden', true);
      if(this.dataset.bodyClass) document.body.classList.remove(this.dataset.bodyClass);
      if(this.height){
        this.style.removeProperty('height');
        if(this.dataset.bodyClass) document.body.style.removeProperty('--page-header-height');
      }
    }
    
    const dropdownClose = () => {
      const dropdowns = this.querySelectorAll('dropdown-component');
      if(!dropdowns) return;
      dropdowns.forEach(dropdown => {
        if(!dropdown.button) return;
        dropdown.close();
      });
    }

    const initialize = () => {
      this.behavior = this.dataset.behavior;
      this.spacer = this.dataset.spacer;
      this.endBounds = document.body.offsetHeight + this.offsetHeight;
      
      if(this.behavior){
        switch (this.behavior) {
          case 'downwards':
            window.addEventListener('scroll', onDownwardScroll.bind(this));
            break;
          case 'upwards':
            window.addEventListener('scroll', onUpwardScroll.bind(this));
            break;
          case 'stacked':
            window.addEventListener('scroll', onStackedScroll.bind(this));
            break;
          case 'observer':
            window.addEventListener('scroll', onObservedScroll.bind(this));
            break;
          default:
            console.log('init sticky block');
            break;
        }
      }
      this.refBlock = document.querySelector(this.dataset.refBlock);
      if(!this.refBlock) return;
      this.refBoundings = this.refBlock.getBoundingClientRect();
      this.offset = this.dataset.offset ? parseFloat(this.dataset.offset) : 0;
      this.threshold = this.refBlock.offsetTop + this.refBoundings.height + this.offset;
      this.previousScrollAmount = window.screenY;
      this.percent = this.dataset.pagePercentage ? this.dataset.pagePercentage : null;
      if(this.spacer) this.height = this.refBlock.offsetHeight;
    }

    const onObservedScroll = () => {
      let revealedAttr = true;
      const handleObserver = (entries, observer) => {
        observer.unobserve(this);
        entries.forEach(entry => {
          if(entry.isIntersecting){
            revealedAttr = false;
          } else{
            revealedAttr = true;
          }
          setStickyStatus(revealedAttr);
        });
      }
      new IntersectionObserver(handleObserver, {rootMargin: '0px 0px -60px 0px'}).observe(this);
    }
    
    const onDownwardScroll = () => {
      let revealedAttr = false;
      if(this.percent){
        const pageHeight = document.documentElement.offsetHeight;
        const threshold = pageHeight * parseFloat(this.percent) / 100;
        this.threshold = threshold;
      }
      if(window.scrollY > this.threshold) revealedAttr = true;
      dropdownClose();
      setStickyStatus(revealedAttr);
    }

    const onUpwardScroll = () => {
      let revealedAttr = false;
      const threshold = this.height ? this.height : this.refBlock.offsetHeight;
      
      if(window.scrollY > this.previousScrollAmount){
        revealedAttr = false;
        
      } else if (window.scrollY < this.previousScrollAmount) {
        revealedAttr = true;
        dropdownClose();
        if(window.scrollY < threshold) revealedAttr = false;
      }
      setStickyStatus(revealedAttr);
      this.previousScrollAmount = window.scrollY;
    }

    const onStackedScroll = () => {
      let revealedAttr = false;
      if(this.refBoundings.y < 0) this.refBoundings.y += window.scrollY;
      if(this.refBoundings.y < window.scrollY) revealedAttr = true;
      dropdownClose();
      setStickyStatus(revealedAttr);
    }
    
    const setStickyStatus = (revealed) => {
      if(this.dataset.hideOnEnd === 'true') if((window.innerHeight + window.scrollY) >= this.endBounds) return stickyHide();
      if(revealed){
        this.setAttribute('data-revealed', true);
        if(this.dataset.hasHidden === 'true') this.removeAttribute('aria-hidden');
        if(this.dataset.bodyClass) document.body.classList.add(this.dataset.bodyClass);
        if(this.height){
          this.style.height = this.height + 'px';
          if(this.dataset.bodyClass) document.body.style.setProperty('--page-header-height', this.height + 'px');
        }
        return;
      }
      stickyHide();
    }
    this.initLoad = setTimeout(initialize.bind(this), 2000);
    document.addEventListener('DOMContentLoaded', function(){this.initLoad;});
  }
});
}

if (!customElements.get('shipping-bar')) {
customElements.define('shipping-bar', class ShippingBar extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback(){
    const setString = () => {
      const dataRate = parseFloat(this.dataset.amount);
      const rateFactor = Shopify.currency.rate || 1;
      const amountCalc = dataRate * rateFactor;
      const html = this.innerHTML;
      const cartTotals = parseFloat(this.dataset.cartTotals) / 100;
      const amount = (amountCalc - cartTotals) * 100;
      if(amount > 0){
        this.innerHTML = html.replace(/\|\|amount\|\|/g, Shopify.formatMoney(amount, window.money_format));
      } else{
        const textContainer = this.querySelector('.shipping-bar_text');
        textContainer.innerHTML = window.cartStrings.shippingAmount;
      }
      this.threshold = amountCalc;
      this.cartTotals = cartTotals;
    }
    
    const setBar = () => {
      const element = this.querySelector('progress');
      if(!element) return;
      const value = (this.cartTotals / this.threshold) * 100;
      element.setAttribute('value', value.toFixed(2));
      element.innerText = value.toFixed(2);
    }
    setString();
    setBar();
  }
});
}

class LocalizationDropdown extends DropdownComponent {
constructor() {
  super();

  this.items = this.content.querySelectorAll('[data-submit-btn]');
  if(!this.items) return;
}

connectedCallback(){
  const onSelect = (event) => {
    event.preventDefault();
    const form = document.getElementById(this.dataset.formId);
    const input = this.querySelector('[data-submit-input]');
    if(!input || !form) return;
    input.value = event.currentTarget.dataset.value;
    form.submit();
  }
  this.select = onSelect.bind(this);
}

open(){
  this.items.forEach(item => {item.addEventListener('click', this.select);});
  super.open();
}

close(){
  this.items.forEach(item => {item.removeEventListener('click', this.select);});
  super.close();
}
}
if(!customElements.get('localization-dropdown')) customElements.define('localization-dropdown', LocalizationDropdown);

class VariantDropdown extends DropdownComponent {
constructor() {
  super();

  this.items = this.content.querySelectorAll('[data-btn-variant]');
  if(!this.items) return;
}

open(){
  this.variantSelect = this.onVariantSelect.bind(this);
  this.items.forEach(item => {item.addEventListener('click', this.variantSelect);});
  super.open();
}

close(){
  this.items.forEach(item => {item.removeEventListener('click', this.variantSelect);});
  super.close();
}

onVariantSelect(event){
  const target = event.target;
  this.items.forEach(item => item.classList.remove('active'));
  target.classList.add('active');
  this.setCurrentValue(target);
}

setCurrentValue(target){
  const elem = this.button.querySelector('[data-current-value]');
  elem.textContent = target.dataset.text;
  this.setVariantOptions(target.dataset.value);
  this.close();
}

setVariantOptions(value){
  const parent = document.querySelector(this.dataset.parent);
  const errElem = document.querySelector(this.dataset.errorSelector);
  if(!parent) return;
  if(errElem) errElem.classList.add('hidden');
  const currentSet = JSON.parse(this.dataset.currentSet);
  const index = parseInt(this.dataset.optionIndex);
  currentSet[index] = value;
  const selects = parent.querySelectorAll('variant-dropdown');
  selects.forEach(select => select.setAttribute('data-current-set', JSON.stringify(currentSet)));
  this.setOptions(selects, currentSet);
  onVariantChange(this.dataset.jsonSelector, currentSet, this.dataset.forms, this.dataset.renders, this.dataset.mainParent, this.dataset.galleries, this.dataset.sectionId, this.dataset.productUrl, this.dataset.updateUrl, this.dataset.focusSelector ? this.dataset.focusSelector : null);
}

setOptions(elems, set){
  const json = document.querySelector(this.dataset.jsonSelector);
  const data = JSON.parse(json.textContent);
  const variants = data.variants;
  const selectedOptionOneVariants = variants.filter(variant => set[0] === variant.option1);
  elems.forEach((select, index) => {
    if (index === 0) return;
    const optionInputs = [...select.querySelectorAll('[data-btn-variant]')];
    const previousOptionSelected = elems[index - 1].querySelector('[data-btn-variant].active').dataset.value;
    const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
    this.setAvailability(optionInputs, availableOptionInputsValue);
  });
}

setAvailability(listOfOptions, listOfAvailableOptions) {
  listOfOptions.forEach(elem => {
    const labelText = elem.querySelector('[data-variant-status-text]');
    if (listOfAvailableOptions.includes(elem.getAttribute('data-value'))){
      labelText.classList.add('hidden');
      return;
    }
    labelText.classList.remove('hidden');
  });
}
}
if(!customElements.get('variant-dropdown')) customElements.define('variant-dropdown', VariantDropdown);

class VariantPill extends HTMLElement {
constructor() {
  super();

  this.variantChange = this.onInputChange.bind(this);
  this.addEventListener('change', this.variantChange);
}

onInputChange(){
  const input = this.querySelector('input[type="radio"]:checked');
  this.setVariantOptions(input.value);
}

setVariantOptions(value){
  const parent = document.querySelector(this.dataset.parent);
  const errElem = document.querySelector(this.dataset.errorSelector);
  const selElem = document.querySelector(this.dataset.selectedParent);
  if(!parent) return;
  if(errElem) errElem.classList.add('hidden');
  if(selElem) selElem.innerText = value;
  const currentSet = JSON.parse(this.dataset.currentSet);
  const index = parseInt(this.dataset.optionIndex);
  currentSet[index] = value;
  const pills = parent.querySelectorAll('variant-pill');
  pills.forEach(pill => pill.setAttribute('data-current-set', JSON.stringify(currentSet)));
  this.setOptions(pills, currentSet);
  let availableSet = null;
  if(this.dataset.checkSets === 'true'){
    const sets = JSON.parse(this.dataset.availableSets);
    const checkSet = (val) => {
      if (!val || !Array.isArray(sets)) return null;
      return sets.find(set => set.includes(val));
    };
    availableSet = checkSet(value);
  }
  onVariantChange(this.dataset.jsonSelector, availableSet ? availableSet : currentSet, this.dataset.forms, this.dataset.renders, this.dataset.mainParent, this.dataset.galleries, this.dataset.sectionId, this.dataset.productUrl, this.dataset.updateUrl, this.dataset.focusSelector ? this.dataset.focusSelector : null, this.dataset.mediaTemplate === 'true' ? true : false, this.dataset.mediaTemplate === 'true' ? this.dataset.template : null);
}

setOptions(elems, set){
  const json = document.querySelector(this.dataset.jsonSelector);
  const data = JSON.parse(json.textContent);
  const variants = data.variants;
  const selectedOptionOneVariants = variants.filter(variant => set[0] === variant.option1);
  elems.forEach((option, index) => {
    if (index === 0) return;
    const optionInputs = [...option.querySelectorAll('input[type="radio"]')];
    const previousOptionSelected = elems[index - 1].querySelector(':checked').value;
    const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
    this.setAvailability(optionInputs, availableOptionInputsValue);
  });
}

setAvailability(listOfOptions, listOfAvailableOptions) {
  listOfOptions.forEach(elem => {
    const label = elem.nextElementSibling;
    const labelText = label.querySelector('[data-variant-status-text]');
    if (listOfAvailableOptions.includes(elem.getAttribute('value'))){
      elem.classList.remove('disabled');
      labelText.classList.add('hidden'), labelText.classList.remove('visually-hidden');
      return;
    }
    elem.classList.add('disabled');
    labelText.classList.remove('hidden'), labelText.classList.add('visually-hidden');
  });
}
}
if(!customElements.get('variant-pill')) customElements.define('variant-pill', VariantPill);

class ProductModel extends DeferredMedia {
constructor() {
  super();
}

_lc() {
  super._lc();
  Shopify.loadFeatures([
    {
      name: 'model-viewer-ui',
      version: '1.0',
      onLoad: this._smv.bind(this),
    }
  ]);
}

_smv(errors) {
  if (errors) return;
  this.modelViewerUI = new Shopify.ModelViewerUI(this.querySelector('model-viewer'));
}
}
if (!customElements.get('line-item-remove')) {
customElements.define('line-item-remove', class LineItemRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('button');
  }

  connectedCallback(){
    if(!this.button) return;

    const onRemoval = (event) => {
      event.preventDefault();
      lineItemUpdate(this.dataset.lineId, 0, this.dataset.sections, this.dataset.parentSelector)
    }
    this.removal = onRemoval.bind(this);
    this.button.addEventListener('click', this.removal);
  }
});
}
if(!customElements.get('product-model')) customElements.define('product-model', ProductModel);
window.ProductModel = {
loadShopifyXR() {
  Shopify.loadFeatures([
    {
      name: 'shopify-xr',
      version: '1.0',
      onLoad: this._sxr.bind(this),
    }
  ]);
},
_sxr(errors) {
  if (errors) return;
  if (!window.ShopifyXR) {
    document.addEventListener('shopify_xr_initialized', () =>
      this._sxr()
    );
    return;
  }
  document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
    window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
    modelJSON.remove();
  });
  window.ShopifyXR.setupXRElements();
}
};
window.addEventListener('DOMContentLoaded', () => window.ProductModel?.loadShopifyXR && window.ProductModel.loadShopifyXR());

class ShareComponent extends DropdownComponent {
constructor() {
  super();

  this.urlInput = this.querySelector('.shareUrl');
  if(navigator.share){
    this.button.removeEventListener('click', this.onButtonClick);
    this.button.addEventListener('click', () => { navigator.share({ url: this.urlInput.value, title: document.title }); });
    this.classList.add('--share-native');
    return;
  }
  this.classList.remove('--share-native');
  this.successMessage = this.querySelector('.shareMessage');
  this.shareButton = this.querySelector('.share-button__copy');
  this.label = this.querySelector('.share-button__label');
  this.shareButton.addEventListener('click', this.copyToClipboard.bind(this));
}

toggleDetails(){
  this.successMessage.classList.add('hidden');
  this.successMessage.textContent = '';
  this.closeButton.classList.add('hidden');
  this.label.classList.remove('hidden');
}

copyToClipboard(){
  navigator.clipboard.writeText(this.urlInput.value).then(() => {
    this.successMessage.classList.remove('hidden');
    this.successMessage.textContent = window.accessibilityStrings.shareSuccess;
    this.closeButton.classList.remove('hidden');
    this.label.classList.add('hidden');
  });
}

close(){
  super.close();
  this.toggleDetails();
}
}
if(!customElements.get('share-component')) customElements.define('share-component', ShareComponent);

class ModalFilterComponent extends ModalRenderComponent {
  constructor() {
    super();
  }

  renderModal(){
    togglerLoader(true);
    const sectionId = document.getElementById('modal-section').value;
    const modalParams = document.querySelector('#filters-params');
    fetch(modalParams.value + sectionId)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html').querySelector(`#${this.dataset.renderSelector}`);
        const parent = this.querySelector(this.dataset.selector);
        parent.innerHTML = html.innerHTML;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      })
      .finally(() => {
        setTimeout(() => {
          this.initFilters();
          togglerLoader(false);
        }, 1000);
      }
    );
  }

  initFilters(){
    trapFocus(this.content);
    this.setListeners(true);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    this.classList.add('--rendered');
    this.fields = this.querySelectorAll('input');
    this.fields.forEach(field => {
      field.addEventListener('input', this.debouncedOnSubmit.bind(this));
    });
  }

  onSubmitHandler(event){
    event.preventDefault();
    const target = event.target;
    switch(target.type){
      case 'checkbox':
        setFilterParam(target.name, target.value, !target.checked);
        break;
      case 'range':
        setFilterParam(target.name, target.value);
        break;
      default:
        console.log('other any');
        break;
    }
    const facetsFilter = document.querySelector('facets-filter');
    facetsFilter.onSubmitHandler(target.id);
  }

  close() {
    this.fields.forEach(field => {
      field.removeEventListener('input', this.onSubmitHandler.bind(this));
    });
    this.classList.remove('--rendered');
    super.close();
  }
}
if(!customElements.get('modal-filter-component')) customElements.define('modal-filter-component', ModalFilterComponent);

class FacetsFilter extends HTMLElement {
  constructor() {
    super();

    this.cachedResults = [];
    window.addEventListener('popstate', this.onHistoryChange.bind(this));
  }

  connectedCallback(){
    this.initParams = setFilterParam(null, null, false, true);
  }

  onHistoryChange(event){
    if(event.state && this.cachedResults.length === 0){
      const searchParams = event.state ? event.state.searchParams : this.initParams;
      const sectionsInput = document.querySelector('#filters-sections');
      const baserUrl = document.querySelector('#base-url');
      const url = baserUrl.value + '?' + searchParams + sectionsInput.value;
      this.renderFetch(url, false, searchParams);
      return;
    }
    
    if(this.cachedResults && this.cachedResults.length > 0){
      const searchParams = event.state ? event.state.searchParams : this.initParams;
      const term = {params: searchParams};
      if (this.cachedResults.some(key => key.params === term.params)) return this.renderFromCache(this.cachedResults, term, false);
      const sectionsInput = document.querySelector('#filters-sections');
      const baserUrl = document.querySelector('#base-url');
      const url = baserUrl.value + '?' + searchParams + sectionsInput.value;
      this.renderFetch(url, false, searchParams);
    }
  }

  onSubmitHandler(target){
    togglerLoader(true);
    const input = document.querySelector('#filters-params');
    let inputValue = input.value;
    if(!inputValue.includes('?')) inputValue = input.value + '?';
    const sectionsInput = document.querySelector('#filters-sections');
    const url = inputValue + sectionsInput.value;
    const searchParams = setFilterParam(null, null, false, true);
    const term = {params: searchParams};
    if(this.cachedResults.length > 0 && this.cachedResults.some(key => key.params === term.params)){
      this.renderFromCache(this.cachedResults, term, true, target);
      return;
    }
    this.renderFetch(url, true, searchParams, target);
  }

  renderFetch(url, updateURLHash = false, searchParams, target = null){
    fetch(url)
      .then(response => response.json())
      .then((data) => {
        const secArr = JSON.parse(this.dataset.sections);
        secArr.forEach(section => {
          const html = new DOMParser() .parseFromString(data[section.id], 'text/html').getElementById(section.id);
          section.selectors.forEach(selector => {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.outerHTML = sourceElement.outerHTML;
            }
          });
        });
        const cacheObj = {params: searchParams, content: data};
        this.cachedResults.push(cacheObj);
      })
      .catch((e) => {
        console.log(e);
        throw e;
      })
      .finally(() => {
        if(updateURLHash) this.updateURLHash(searchParams);
        const modal = document.querySelector('modal-filter-component.modal--active');
        if(modal) modal.initFilters();
        if(target){
          const org = document.getElementById(target);
          if(org) org.focus();
        }
        togglerLoader(false);
      }
    );
  }

  renderFromCache(cache, filter, updateURLHash = false, target = null){
    const cacheDataArr = cache;
    const cachedResults = cacheDataArr.find(results => results.params === filter.params);
    const secArr = JSON.parse(this.dataset.sections);
    secArr.forEach(section => {
      const html = new DOMParser() .parseFromString(cachedResults.content[section.id], 'text/html').getElementById(section.id);
      section.selectors.forEach(selector => {
        const targetElement = document.querySelector(selector);
        const sourceElement = html.querySelector(selector);
        if (targetElement && sourceElement) {
          targetElement.outerHTML = sourceElement.outerHTML;
        }
      });
    });
    if(updateURLHash) this.updateURLHash(filter.params);
    const modal = document.querySelector('modal-filter-component.modal--active');
    if(modal) modal.initFilters();
    if(target){
      const org = document.getElementById(target);
      if(org) org.focus();
    }
    togglerLoader(false);
  }

  updateURLHash(searchParams){
    const updatedSearchParams = setFilterParam(null, null, false, true);
    history.pushState({ searchParams }, '', `${window.location.pathname}${updatedSearchParams && '?'.concat(updatedSearchParams)}`);
  }
}
if(!customElements.get('facets-filter')) customElements.define('facets-filter', FacetsFilter);

class PriceRange extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(){
    this.inputs = this.querySelectorAll('input[type="range"]');
    if(!this.inputs) return;

    const onSlideWatch = () => {
      const minInput = this.querySelector('.min');
      const maxInput = this.querySelector('.max');
      const minText = this.querySelector('[data-text-min]');
      const maxText = this.querySelector('[data-text-max]');
      var minVal = minInput.value;
      var maxVal = maxInput.value;
      if(minInput && minVal > maxVal-0) minInput.value = maxVal - 0;
      setPriceText(minText, minInput.value);
      if(maxInput && maxVal-0 < minVal) maxInput.value = 0 + minVal;
      setPriceText(maxText, maxInput.value);
    }

    const setPriceText = (element, value) => {
      const price = parseFloat(value) * 100;
      element.innerText = Shopify.formatMoney(price, window.money_format);
    }
    this.watch = onSlideWatch.bind(this);
    this.inputs.forEach(input => {
      input.addEventListener('input', this.watch);
    });
  }
}
customElements.define('price-range', PriceRange);

class SortDropdown extends DropdownComponent {
  constructor() {
    super();
  
    this.items = this.content.querySelectorAll('[data-btn-sort]');
    if(!this.items) return;
  }
  
  connectedCallback(){
    const setCurrentValue = (target) => {
      const elem = this.button.querySelector('[data-current-value]');
      elem.textContent = target.dataset.text;
      setFilterParam('sort_by', target.dataset.value);
      const facetsFilter = document.querySelector('facets-filter');
      facetsFilter.onSubmitHandler();
      this.close();
    }
  
    const onSortSelect = (event) => {
      const target = event.target;
      this.items.forEach(item => item.classList.remove('active'));
      target.classList.add('active');
      setCurrentValue(target);
    }
    this.sortSelect = onSortSelect.bind(this);
  }
  
  open(){
    this.items.forEach(item => {item.addEventListener('click', this.sortSelect);});
    super.open();
  }
  
  close(){
    this.items.forEach(item => {item.removeEventListener('click', this.sortSelect);});
    super.close();
  }
}
if(!customElements.get('sort-dropdown')) customElements.define('sort-dropdown', SortDropdown);

class FacetRemoveButton extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback(){
    this.button = this.querySelector('button');
    if(!this.button) return;
  
    const onClick = (event) => {
      event.preventDefault();
      switch (this.dataset.name) {
        case 'all':
          setFilterParam(null, null, 'all')
          break;
        default:
          setFilterParam(this.dataset.name, this.dataset.value, true);
          break;
      }
      const facetsFilter = document.querySelector('facets-filter');
      facetsFilter.onSubmitHandler();
    }
    this.button.addEventListener('click', onClick.bind(this));
  }
  }
  if(!customElements.get('facet-remove-button')) customElements.define('facet-remove-button', FacetRemoveButton);

if (!customElements.get('product-recommendations')) {
customElements.define('product-recommendations', class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.empty = true;
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          const html = document.createElement('div');
          html.innerHTML = text;
          const recommendations = html.querySelector('.product-recommendations');
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.empty = false;
            this.innerHTML = recommendations.innerHTML;
            if(!recommendations.innerHTML.includes('data-recommend-check')){
              let recommendationAncestor = this.parentElement;
              while (recommendationAncestor && !recommendationAncestor.classList.contains('recommendation')) {
                recommendationAncestor = recommendationAncestor.parentElement;
              }
              if(recommendationAncestor) recommendationAncestor.classList.add('hidden');
            }
          }
        })
        .catch(e => {
          console.error(e);
        })
        .finally(() => {
          if(this.empty) this.parentElement.classList.add('hidden');
        }
      );
    }
    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
});
}

class PredictiveDropdown extends DropdownComponent {
  constructor() {
    super();

    this.searchTerm = '';
    this.cachedResults = [];
    this.abortController = null;

    this._isBound = false;
    this._latestFetchId = 0;
    this._mode = 'legacy'; // 'enhanced' | 'legacy'

    this.handleScroll = this.handleScroll.bind(this);
    this._onMqlChange = () => this.syncBinding();
  }

  connectedCallback() {
    this.options = {
      enable_dropdown: this.getAttribute('enable-dropdown') === 'true'
    };

    this.form = this.querySelector('form');
    this.input = this.querySelector('input[name="q"]');
    this.container = this.querySelector('[data-render-predict-results]');
    if (!this.input || !this.container) return;

    // Hidden by default
    this.container.classList.add('hidden');
    this.container.setAttribute('aria-hidden', 'true');

    this.debouncedOnSubmit = debounce(() => this.onFetchQuery(), 500);

    // Media gate for enhanced mode
    this._mql = window.matchMedia('(min-width: 768px)');
    if (this._mql.addEventListener) this._mql.addEventListener('change', this._onMqlChange);
    else if (this._mql.addListener) this._mql.addListener(this._onMqlChange);

    this.syncBinding();
  }

  disconnectedCallback() {
    this.teardownBinding(true);
    if (this._mql?.removeEventListener) this._mql.removeEventListener('change', this._onMqlChange);
    else if (this._mql?.removeListener) this._mql.removeListener(this._onMqlChange);
  }

  // Decide mode + attach the right listeners
  syncBinding() {
    const enhanced = this.options.enable_dropdown && this._mql.matches;
    this._mode = enhanced ? 'enhanced' : 'legacy';

    // Always keep input handler bound so predictive works in both modes
    if (!this._isBound) {
      this.input.addEventListener('input', this.debouncedOnSubmit);
      this._isBound = true;
    }

    // Add/remove enhanced-only bindings
    if (enhanced) {
      if (!this._onFocusOpen) {
        this._onFocusOpen = () => this.open();
        this.input.addEventListener('focus', this._onFocusOpen);
        this.input.addEventListener('click', this._onFocusOpen);
      }
      window.addEventListener('scroll', this.handleScroll);
    } else {
      if (this._onFocusOpen) {
        this.input.removeEventListener('focus', this._onFocusOpen);
        this.input.removeEventListener('click', this._onFocusOpen);
        this._onFocusOpen = null;
      }
      window.removeEventListener('scroll', this.handleScroll);
    }

    // On mode switch, if there's no query, keep panel hidden
    if (!this.input.value.trim()) this.toggleResults(false, { preserveInput: true });
  }

  // Full unbind (on unmount)
  teardownBinding(forceAll = false) {
    if (this._isBound) {
      this.input.removeEventListener('input', this.debouncedOnSubmit);
      this._isBound = false;
    }
    if (this._onFocusOpen) {
      this.input.removeEventListener('focus', this._onFocusOpen);
      this.input.removeEventListener('click', this._onFocusOpen);
      this._onFocusOpen = null;
    }
    window.removeEventListener('scroll', this.handleScroll);
    if (forceAll) this.toggleResults(false);
  }

  open() {
    // Do NOT unhide here; results should control visibility
    super.open?.();
  }

  close() {
    // Abort any in-flight request and clear query so reopen starts clean
    this.resetQueryState();
    this.toggleResults(false); // clears input & hides panel
    super.close?.();
  }

  handleScroll() {
    if (this._mode === 'enhanced') this.close();
  }

  onFetchQuery() {
    const raw = (this.input.value || '');
    const inputValueTerm = raw.replace(/\s/g, '');

    if (inputValueTerm.length > 0) {
      this.searchTerm = raw.trim();

      const cached = this.cachedResults.find(r => r.searchTerm === this.searchTerm);
      if (cached) {
        this.showCachedResults({ searchTerm: this.searchTerm }, this.cachedResults);
      } else {
        this.fetchSearchResults(this.searchTerm);
      }
      return;
    }

    // Empty -> hide (panel has `hidden` like before)
    this.toggleResults(false, { preserveInput: true });
  }

  fetchSearchResults(terms) {
    togglerLoader(true);

    // Abort previous request; start fresh
    try { this.abortController?.abort(); } catch {}
    this.abortController = new AbortController();
    const fetchId = ++this._latestFetchId;

    fetch(
      `${routes.predictive_search_url}?q=${encodeURIComponent(terms)}&section_id=predictive-organizer&resources[type]=${this.dataset.query}`,
      { signal: this.abortController.signal }
    )
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        return response.text();
      })
      .then((text) => {
        // Ignore stale responses
        if (fetchId !== this._latestFetchId) return;

        const html = new DOMParser().parseFromString(text, 'text/html');
        const inner = html.querySelector('[data-render-predict-results]');
        if (!inner) return;

        // Cache whole document so we can rebuild later
        this.cachedResults.push({ searchTerm: this.searchTerm, contentHtml: html });

        this.container.innerHTML = inner.innerHTML;
        this.toggleResults(true, { preserveInput: true }); // show panel; keep current query text
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || error?.code === 20) return;
        console.error(error);
      })
      .finally(() => togglerLoader(false));
  }

  showCachedResults(data, cache) {
    const cached = cache.find(r => r.searchTerm === data.searchTerm);
    if (!cached) return;

    const inner = cached.contentHtml.querySelector('[data-render-predict-results]');
    if (!inner) return;

    this.container.innerHTML = inner.innerHTML;
    this.toggleResults(true, { preserveInput: true });
  }

  // ---- helpers ----
  resetQueryState() {
    // stop any response from updating UI after close
    try { this.abortController?.abort(); } catch {}
    this.abortController = null;
    this._latestFetchId++; // invalidate any late responses

    this.searchTerm = '';
    if (this.input) this.input.value = '';
  }

  // Always add/remove the 'hidden' class (and aria-hidden) here
  toggleResults(show, { preserveInput = false } = {}) {
    if (!this.container) return;
    if (show) {
      this.container.classList.remove('hidden');
      this.container.removeAttribute('aria-hidden');
      return;
    }
    if (this.input && !preserveInput) this.input.value = '';
    this.container.classList.add('hidden');
    this.container.setAttribute('aria-hidden', 'true');
  }
}

if (!customElements.get('predictive-dropdown')) {
  customElements.define('predictive-dropdown', PredictiveDropdown);
}

class BeforeAfter extends HTMLElement {
constructor() {
  super();
}

connectedCallback(){
  this.pointer = this.querySelector('input');
  if(!this.pointer) return;

  const onComparison = (event) => {
    this.style.setProperty('--after-placement', `${event.target.value}%`);
  }

  const setListners = () => {
    this.comparison = onComparison.bind(this);
    this.pointer.addEventListener('input', this.comparison);
  }
  setListners();
}
}
if(!customElements.get('before-after')) customElements.define('before-after', BeforeAfter);

if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      const endDate = new Date(this.getAttribute('end-date'));
      if (isNaN(endDate)) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      } else {
        const remainingTime = endDate.getTime() - Date.now();
        if (remainingTime <= 0) {
          this.innerHTML = `<div class="block"><span class="time --word-break">0</span><span class="text">${window.additionalStrings.countdown_days_label}</span></div><div class="block"><span class="time --word-break">0</span><span class="text">${window.additionalStrings.countdown_hours_label}</span></div><div class="block"><span class="time --word-break">0</span><span class="text">${window.additionalStrings.countdown_min_label}</span></div><div class="block"><span class="time --word-break">0</span><span class="text">${window.additionalStrings.countdown_sec_label}</span></div>`;
        } else {
          this.remainingTime = remainingTime;
          this.innerHTML = this.getTimeString();
        }
      }
    }

    connectedCallback() {
      if (isNaN(this.remainingTime)) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      this.intervalId = setInterval(() => {
        this.remainingTime -= 1000;
        this.innerHTML = this.getTimeString();
        if (this.remainingTime <= 0) {
          clearInterval(this.intervalId);
          this.dispatchEvent(new Event('timeup'));
        }
      }, 1000);
    }

    getTimeString() {
      if (isNaN(this.remainingTime) || this.remainingTime <= 0) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      const days = Math.floor(this.remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((this.remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((this.remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((this.remainingTime % (1000 * 60)) / 1000);
      return `<div class="block"><span class="time">${days}</span><span class="text">${window.additionalStrings.countdown_days_label}</span></div><div class="block"><span class="time">${hours}</span><span class="text">${window.additionalStrings.countdown_hours_label}</span></div><div class="block"><span class="time">${minutes}</span><span class="text">${window.additionalStrings.countdown_min_label}</span></div><div class="block"><span class="time">${seconds}</span><span class="text">${window.additionalStrings.countdown_sec_label}</span></div>`;
    }
  });
}

if (!customElements.get('grid-load-more')) {
  customElements.define('grid-load-more', class GridLoadMore extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
      this.loader = this.querySelector('[data-loader]');
    }

    connectedCallback() {
      if (!this.button) return;

      const initialize = () => {
        if (this.dataset.infinite === 'true') this.requested = false;
        setListeners();
      };

      const setListeners = () => {
        const loadMore = onLoadMore.bind(this);
        this.button.addEventListener('click', loadMore);

        if (this.dataset.infinite === 'true') {
          window.addEventListener('scroll', loadInfinite.bind(this));
        }
      };

      const loadInfinite = () => {
        const handleObserver = (entries, observer) => {
          observer.unobserve(this);
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (this.requested) return;
              this.button.dispatchEvent(new Event('click'));
              this.requested = true;
            } else {
              this.requested = false;
            }
          });
        };

        new IntersectionObserver(handleObserver, { rootMargin: '0px 0px -60px 0px' }).observe(this);
      };

      const onLoadMore = (event) => {
        event.preventDefault();
        this.button.classList.add('disabled');
        this.loader.classList.remove('hidden');
        this.showButton = true;

        fetch(this.dataset.url)
          .then(response => response.text())
          .then(text => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;

            const columns = tempDiv.querySelectorAll('[data-render-columns]');
            const paginationWrapper = document.querySelector('[data-paging-loader-parent]');
            const newPagination = tempDiv.querySelector('[data-paging-loader-parent]');
            const parentNode = paginationWrapper.parentNode;

            columns.forEach(column => {
              parentNode.insertBefore(column, paginationWrapper);

              const atcBtn = column.querySelector('atc-submit-form');
              if (atcBtn) atcBtn.initialize();

              const variantChanger = column.querySelector('single-variant');
              if (variantChanger) variantChanger.initialize();
            });

            if (newPagination) {
              paginationWrapper.innerHTML = newPagination.innerHTML;
            } else {
              this.showButton = false;
            }
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            if (!this.showButton) return hideButton();
            this.button.classList.remove('disabled');
            this.loader.classList.add('hidden');
          });
      };

      const hideButton = () => {
        const parent = this.parentElement;
        parent.style.display = 'none';
      };
      initialize();
    }
  });
}

if (!customElements.get('focused-element')) {
  customElements.define('focused-element', class FocusedElement extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback(){
      addHoverOnElement(this);
    }
  });
}

class TruncateText extends HTMLElement {
  constructor() {
    super();
    this.truncateLength = parseInt(this.getAttribute('truncate-length')) || 100;
    this.toggleText = this.toggleText.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  connectedCallback() {
    this.textElement = this.querySelector('.description-text');
    this.dotsElement = this.querySelector('.dots');
    this.toggleElement = this.querySelector('.toggle-text');
    if (!this.textElement || !this.dotsElement || !this.toggleElement) {
      console.error('Missing required elements (.description-text, .dots, .toggle-text) in TruncateText.');
      return;
    }
    this.fullText = this.textElement.textContent.trim();
    this.truncatedText = this.fullText.substring(0, this.truncateLength);
    if (this.fullText.length > this.truncateLength) {
      this.textElement.textContent = this.truncatedText;
      this.dotsElement.style.display = 'inline';
      this.toggleElement.style.display = 'inline';
      this.toggleElement.setAttribute('tabindex', '0');
      this.toggleElement.setAttribute('role', 'button');
      this.toggleElement.setAttribute('aria-expanded', 'false');
      this.toggleElement.addEventListener('click', this.toggleText);
      this.toggleElement.addEventListener('keydown', this.handleKeyPress);
    } else {
      this.dotsElement.style.display = 'none';
      this.toggleElement.style.display = 'none';
    }
  }

  toggleText() {
    const isExpanded = this.toggleElement.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      this.textElement.textContent = this.truncatedText;
      this.dotsElement.style.display = 'inline';
      this.toggleElement.textContent = 'Read more';
    } else {
      this.textElement.textContent = this.fullText;
      this.dotsElement.style.display = 'none';
      this.toggleElement.textContent = 'Show less';
    }
    this.toggleElement.setAttribute('aria-expanded', (!isExpanded).toString());
  }

  handleKeyPress(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleText();
    }
  }

  disconnectedCallback() {
    if (this.toggleElement) {
      this.toggleElement.removeEventListener('click', this.toggleText);
      this.toggleElement.removeEventListener('keydown', this.handleKeyPress);
    }
  }
}
customElements.define('truncate-text', TruncateText);

class RecipientForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(){
    this.checkboxInput = this.querySelector(`[id*="Recipient-Checkbox"]`);
    this.checkboxInput.disabled = false;
    this.hiddenControlField = this.querySelector(`[id*="Recipient-Control"]`);
    this.hiddenControlField.disabled = true;
    this.emailInput = this.querySelector(`[id*="Recipient-email"]`);
    this.nameInput = this.querySelector(`[id*="Recipient-name"]`);
    this.messageInput = this.querySelector(`[id*="Recipient-message"]`);
    this.sendonInput = this.querySelector(`[id*="Recipient-send-on"]`);
    this.errorMessageWrapper = this.querySelector('.product-form__recipient-error-message-wrapper');
    this.errorMessageList = this.errorMessageWrapper.querySelector('ul');
    this.errorMessage = this.errorMessageWrapper.querySelector('.error-message');
    this.defaultErrorHeader = this.errorMessage?.innerText;
    this.currentProductVariantId = this.dataset.productVariantId;
    this.addEventListener('change', this.onChange.bind(this));
  }

  onChange() {
    if (!this.checkboxInput.checked) {
      this.clearInputFields();
      this.clearErrorMessage();
    }
  }

  clearInputFields(flag = false) {
    if (this.emailInput) this.emailInput.value = '';
    if (this.nameInput) this.nameInput.value = '';
    if (this.messageInput) this.messageInput.value = '';
    if (this.sendonInput) this.sendonInput.value = '';
    if (flag) this.checkboxInput.checked = false;
  }

  displayErrorMessage(title, body) {
    this.clearErrorMessage();
    this.errorMessageWrapper.hidden = false;
    if (typeof body === 'object') {
      this.errorMessage.innerText = this.defaultErrorHeader;
      return Object.entries(body).forEach(([key, value]) => {
        const errorMessageId = `RecipientForm-${ key }-error-${ this.dataset.sectionId }-${this.dataset.productId}`;
        const fieldSelector = `#Recipient-${ key }-${ this.dataset.sectionId }-${this.dataset.productId}`;
        const label = key.includes('send_on') ? '' : key;
        const message = `${label} ${value}`;
        const errorMessageElement = this.querySelector(`#${errorMessageId}`);
        const errorTextElement = errorMessageElement?.querySelector('.error-message');
        if (!errorTextElement) return;
        if (this.errorMessageList) this.errorMessageList.appendChild(this.createErrorListItem(fieldSelector, message));
        errorTextElement.innerText = `${message}.`;
        errorMessageElement.classList.remove('hidden');
        const inputElement = this[`${key}Input`];
        if (!inputElement) return;
        inputElement.setAttribute('aria-invalid', true);
        inputElement.setAttribute('aria-describedby', errorMessageId);
      });
    }
    this.errorMessage.innerText = body;
  }

  createErrorListItem(target, message) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.setAttribute('href', target);
    a.innerText = message;
    a.classList.add('errors-list_link');
    li.appendChild(a);
    li.className = "error-message errors-list_item";
    return li;
  }

  clearErrorMessage() {
    this.errorMessageWrapper.hidden = true;
    if (this.errorMessageList) this.errorMessageList.innerHTML = '';
    this.querySelectorAll('.recipient-fields .form__message').forEach(field => {
      field.classList.add('hidden');
      const textField = field.querySelector('.error-message');
      if (textField) textField.innerText = '';
    });
    [this.emailInput, this.messageInput, this.nameInput].forEach(inputElement => {
      inputElement.setAttribute('aria-invalid', false);
      inputElement.removeAttribute('aria-describedby');
    });
  }

  resetRecipientForm() {
    if (this.checkboxInput.checked) {
      this.checkboxInput.checked = false;
      this.clearInputFields();
      this.clearErrorMessage();
    }
  }
}
if(!customElements.get('recipient-form')) customElements.define('recipient-form', RecipientForm);