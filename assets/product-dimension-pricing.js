(function () {
  'use strict';

  var UNIT_TO_METERS = {
    cm: 0.01,
    meters: 1,
    in: 0.0254,
    ft: 0.3048
  };

  var validationMsg = 'Please enter width, height, and measurement units.';
  var validationRangeMsg = 'Width and height must be whole numbers between 100 and 999999999.';

  function convertToMeters(value, unit) {
    var factor = UNIT_TO_METERS[unit];
    if (factor == null) return null;
    return value * factor;
  }

  function calculateSquareMeters(width, height, unit) {
    var widthM = convertToMeters(width, unit);
    var heightM = convertToMeters(height, unit);
    if (widthM == null || heightM == null) return null;
    return widthM * heightM;
  }

  function calculateTotalPrice(sqm, variantPriceCents) {
    if (sqm == null || variantPriceCents == null) return null;
    return Math.round(sqm * variantPriceCents);
  }

  function formatMoney(cents) {
    var moneyFormat = window.money_format || '${{amount}}';
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(cents, moneyFormat);
    }
    return (cents / 100).toFixed(2);
  }

  function validateDimensions(w, h, unit) {
    if (!w || !h || !unit) {
      return { valid: false, message: validationMsg };
    }
    if (!/^\d+$/.test(w) || !/^\d+$/.test(h)) {
      return { valid: false, message: validationRangeMsg };
    }
    var wn = parseInt(w, 10);
    var hn = parseInt(h, 10);
    if (wn < 100 || hn < 100 || wn > 999999999 || hn > 999999999) {
      return { valid: false, message: validationRangeMsg };
    }
    return { valid: true, message: '' };
  }

  function initProductDimensionPricing(config) {
    var sectionId = config.sectionId;
    var root = document.querySelector('.product-dimension-fields[data-dimension-root="' + sectionId + '"]');
    if (!root) return;

    var formId = root.getAttribute('data-form-id');
    var form = document.getElementById(formId);
    var mainParentSel = root.getAttribute('data-main-parent');
    var priceRenderSel = root.getAttribute('data-price-render');
    var qtyRenderSel = root.getAttribute('data-qty-render');

    var inpW = root.querySelector('[data-dimension-width]');
    var inpH = root.querySelector('[data-dimension-height]');
    var selU = root.querySelector('[data-dimension-units]');
    var sqmHidden = root.querySelector('[data-dimension-sqm-hidden]');
    var priceHidden = root.querySelector('[data-dimension-price-hidden]');
    var priceCentsHidden = root.querySelector('[data-dimension-price-cents-hidden]');
    var sqmDisplay = root.querySelector('[data-dimension-sqm-display]');
    var priceDisplay = root.querySelector('[data-dimension-price-display]');
    var errEl = root.querySelector('[data-dimension-error]');

    var state = {
      variantPriceCents: null,
      variantAvailable: true,
      sqm: null,
      totalCents: null
    };

    function getMainParent() {
      return mainParentSel ? document.querySelector(mainParentSel) : document;
    }

    function getAtcButton() {
      if (!form) return null;
      return form.querySelector('[name="add"]');
    }

    function getDynamicCheckoutButtons() {
      if (!form) return [];
      var wrappers = form.querySelectorAll('.product-common_dynamic-btns, .shopify-payment-button');
      return Array.prototype.slice.call(wrappers);
    }

    function showError(message) {
      if (!errEl) return;
      if (message) {
        errEl.textContent = message;
        errEl.classList.remove('hidden');
      } else {
        errEl.textContent = '';
        errEl.classList.add('hidden');
      }
    }

    function setSummaryPlaceholder() {
      if (sqmDisplay) {
        sqmDisplay.textContent = '—';
        sqmDisplay.classList.add('product-dimension-fields_summary-value--placeholder');
      }
      if (priceDisplay) {
        priceDisplay.textContent = 'Enter dimensions';
        priceDisplay.classList.add('product-dimension-fields_summary-value--placeholder');
      }
      if (sqmHidden) sqmHidden.value = '';
      if (priceHidden) priceHidden.value = '';
      if (priceCentsHidden) priceCentsHidden.value = '';
    }

    function updateSummary(sqm, totalCents) {
      var sqmText = sqm != null ? sqm.toFixed(2) : '—';
      var priceText = totalCents != null ? formatMoney(totalCents) : 'Enter dimensions';

      if (sqmDisplay) {
        sqmDisplay.textContent = sqmText;
        sqmDisplay.classList.toggle('product-dimension-fields_summary-value--placeholder', sqm == null);
      }
      if (priceDisplay) {
        priceDisplay.textContent = priceText;
        priceDisplay.classList.toggle('product-dimension-fields_summary-value--placeholder', totalCents == null);
      }
      if (sqmHidden) sqmHidden.value = sqm != null ? sqm.toFixed(2) : '';
      if (priceHidden) priceHidden.value = totalCents != null ? formatMoney(totalCents) : '';
      if (priceCentsHidden) priceCentsHidden.value = totalCents != null ? String(totalCents) : '';
    }

    function updatePriceDisplay(totalCents) {
      var parent = getMainParent();
      if (!parent || !priceRenderSel) return;
      var priceWrap = parent.querySelector(priceRenderSel);
      if (!priceWrap) return;

      var mainPrice = priceWrap.querySelector('.main-price');
      if (!mainPrice) return;

      if (totalCents == null) {
        mainPrice.textContent = 'Enter dimensions';
        return;
      }
      mainPrice.textContent = formatMoney(totalCents);
    }

    function updateQuantitySubtotal(totalCents) {
      var parent = getMainParent();
      if (!parent || !qtyRenderSel) return;
      var qtyWrap = parent.querySelector(qtyRenderSel);
      if (!qtyWrap) return;

      var quantityInput = qtyWrap.querySelector('quantity-input');
      var qtySubtotal = qtyWrap.querySelector('[data-qty-subtotal]');
      if (!quantityInput || !qtySubtotal) return;

      if (totalCents == null) {
        quantityInput.dataset.variantPrice = '0';
        qtySubtotal.textContent = '—';
        return;
      }

      quantityInput.dataset.variantPrice = String(totalCents);
      var qty = parseInt(quantityInput.querySelector('input[name="quantity"]')?.value || '1', 10);
      qtySubtotal.textContent = formatMoney(totalCents * qty);
    }

    function setAtcEnabled(valid) {
      var atcBtn = getAtcButton();
      var canPurchase = valid && state.variantAvailable;

      if (atcBtn) {
        if (canPurchase) {
          atcBtn.removeAttribute('disabled');
          var textContainer = atcBtn.querySelector('[data-atc-text]');
          if (textContainer && textContainer.dataset.textAvail) {
            textContainer.innerText = textContainer.dataset.textAvail;
          }
        } else if (!state.variantAvailable) {
          atcBtn.setAttribute('disabled', '');
        } else {
          atcBtn.setAttribute('disabled', '');
        }
      }

      getDynamicCheckoutButtons().forEach(function (el) {
        if (canPurchase) {
          el.classList.remove('hidden');
          el.removeAttribute('aria-hidden');
        } else {
          el.classList.add('hidden');
          el.setAttribute('aria-hidden', 'true');
        }
      });
    }

    function recalculate() {
      var w = (inpW && inpW.value.trim()) || '';
      var h = (inpH && inpH.value.trim()) || '';
      var unit = (selU && selU.value) || '';
      var validation = validateDimensions(w, h, unit);

      if (!validation.valid) {
        state.sqm = null;
        state.totalCents = null;
        setSummaryPlaceholder();
        updatePriceDisplay(null);
        updateQuantitySubtotal(null);
        setAtcEnabled(false);
        return validation;
      }

      var wn = parseInt(w, 10);
      var hn = parseInt(h, 10);
      var sqm = calculateSquareMeters(wn, hn, unit);
      var totalCents = calculateTotalPrice(sqm, state.variantPriceCents);

      state.sqm = sqm;
      state.totalCents = totalCents;

      updateSummary(sqm, totalCents);
      updatePriceDisplay(totalCents);
      updateQuantitySubtotal(totalCents);
      setAtcEnabled(true);
      showError('');
      return validation;
    }

    function onVariantChange(variant) {
      if (!variant) return;
      state.variantPriceCents = variant.price;
      state.variantAvailable = variant.available !== false;
      recalculate();
    }

    document.addEventListener('cascade:variant-change', function (e) {
      if (e.detail && String(e.detail.sectionId) === String(sectionId)) {
        onVariantChange(e.detail.variant);
      }
    });

    window.themeAfterVariantRender = function (renderSectionId) {
      if (String(renderSectionId) !== String(sectionId)) return;
      recalculate();
    };

    [inpW, inpH, selU].forEach(function (el) {
      if (!el) return;
      el.addEventListener('input', function () {
        showError('');
        recalculate();
      });
      el.addEventListener('change', function () {
        showError('');
        recalculate();
      });
    });

    if (form) {
      form.addEventListener(
        'submit',
        function (e) {
          var validation = recalculate();
          if (!validation.valid) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showError(validation.message);
            if (inpW && !inpW.value.trim()) inpW.focus();
            else if (inpH && !inpH.value.trim()) inpH.focus();
            else if (selU && !selU.value) selU.focus();
          }
        },
        true
      );

      var qtyInput = form.querySelector('input[name="quantity"]');
      if (qtyInput) {
        qtyInput.addEventListener('change', function () {
          updateQuantitySubtotal(state.totalCents);
        });
        qtyInput.addEventListener('input', function () {
          updateQuantitySubtotal(state.totalCents);
        });
      }
    }

    setSummaryPlaceholder();
    updatePriceDisplay(null);
    updateQuantitySubtotal(null);
    setAtcEnabled(false);

    var variantIdInput = form ? form.querySelector('input[name="id"]') : null;
    if (variantIdInput) {
      var fullJsonEl = document.getElementById('CustomVariantsFull-' + sectionId);
      if (fullJsonEl) {
        try {
          var variants = JSON.parse(fullJsonEl.textContent);
          var currentId = parseInt(variantIdInput.value, 10);
          var current = variants.find(function (v) {
            return v.id === currentId;
          });
          if (current) onVariantChange(current);
        } catch (e) {
          /* ignore */
        }
      }
    }
  }

  window.initProductDimensionPricing = initProductDimensionPricing;
  window.productDimensionPricing = {
    convertToMeters: convertToMeters,
    calculateSquareMeters: calculateSquareMeters,
    calculateTotalPrice: calculateTotalPrice,
    validateDimensions: validateDimensions
  };
})();
