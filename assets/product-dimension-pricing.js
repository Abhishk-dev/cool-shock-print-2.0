(function () {
  'use strict';

  var UNIT_TO_METERS = {
    cm: 0.01,
    meters: 1,
    in: 0.0254,
    ft: 0.3048
  };

  var UNIT_TO_CPC_LABEL = {
    cm: 'cm',
    meters: 'meter',
    in: 'inches',
    ft: 'feet'
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

  function getCpcCalculator(form) {
    if (!form) return document.querySelector('#calculator');
    return form.querySelector('#calculator') || document.querySelector('#calculator');
  }

  function cpcField(calc, identifier) {
    return calc ? calc.querySelector('[data-identifier="' + identifier + '"]') : null;
  }

  function triggerCpcChange(el) {
    if (!el) return;
    if (el.tagName === 'SELECT' && typeof window.ChangeEvent === 'function') {
      window.ChangeEvent(null, el);
      return;
    }
    if (typeof window.PriceUpdation === 'function') {
      window.PriceUpdation(el);
    }
  }

  function selectCpcUnit(calc, unit) {
    var sel = cpcField(calc, 'Measurement Units');
    if (!sel) return;
    var label = UNIT_TO_CPC_LABEL[unit] || unit;
    var options = Array.prototype.slice.call(sel.options);
    var match = options.find(function (opt) {
      var optLabel = (opt.dataset && opt.dataset.label) || opt.textContent.trim();
      return String(optLabel).toLowerCase() === String(label).toLowerCase();
    });
    if (match) {
      sel.value = match.value;
      triggerCpcChange(sel);
    }
  }

  function syncCpcNumberInput(calc, variantPriceCents) {
    var numberInput = cpcField(calc, 'Number Input');
    if (!numberInput || variantPriceCents == null) return;
    var pounds = (variantPriceCents / 100).toFixed(2);
    numberInput.value = pounds;
    triggerCpcChange(numberInput);
  }

  function syncCpcTypePrice(calc, variantPriceCents) {
    var typeEl = cpcField(calc, 'Type');
    if (!typeEl || variantPriceCents == null) return;
    var pounds = (variantPriceCents / 100).toFixed(2);
    typeEl.dataset.val = pounds;
    typeEl.setAttribute('data-val', pounds);
    Array.prototype.forEach.call(typeEl.options, function (opt) {
      opt.dataset.val = pounds;
      opt.setAttribute('data-val', pounds);
    });
    triggerCpcChange(typeEl);
  }

  function syncCpcVariantId(form, variant) {
    if (!form || !variant) return;
    var variantIdCustom = form.querySelector('#variantIdCustom');
    if (variantIdCustom) {
      variantIdCustom.value = String(variant.id);
    }
  }

  function syncToCpc(calc, form, values) {
    if (!calc) return false;

    var widthEl = cpcField(calc, 'Width');
    var heightEl = cpcField(calc, 'Height');
    var qtyEl = cpcField(calc, 'Quantity');

    if (widthEl && values.width != null) {
      widthEl.value = values.width;
      triggerCpcChange(widthEl);
    }
    if (heightEl && values.height != null) {
      heightEl.value = values.height;
      triggerCpcChange(heightEl);
    }
    if (values.unit) {
      selectCpcUnit(calc, values.unit);
    }
    if (qtyEl && values.quantity != null) {
      qtyEl.value = String(values.quantity);
      triggerCpcChange(qtyEl);
    }
    if (values.variantPriceCents != null) {
      syncCpcNumberInput(calc, values.variantPriceCents);
      syncCpcTypePrice(calc, values.variantPriceCents);
    }
    if (values.variant) {
      syncCpcVariantId(form, values.variant);
    }

    return true;
  }

  function parseMoneyish(value) {
    if (value == null || value === '') return null;
    var cleaned = String(value).replace(/[^0-9.\-]/g, '');
    if (!cleaned) return null;
    var num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function readCpcResults(calc, form) {
    if (!calc) return null;

    var sqmInput = calc.querySelector('#calculation_inp_Total_Square_Meters');
    var priceInput = calc.querySelector('#calculation_inp_Calculated_price');
    var priceTicker = calc.querySelector('#priceTicker');
    var cpcToken = form ? form.querySelector('#cpcPriceToken') : null;

    var sqm = sqmInput ? parseFloat(sqmInput.value) : null;
    if (sqm != null && isNaN(sqm)) sqm = null;

    var totalMoney = null;
    if (priceTicker) {
      totalMoney =
        parseMoneyish(priceTicker.getAttribute('data-origmoney')) ||
        parseMoneyish(priceTicker.textContent);
    }
    if (totalMoney == null && priceInput) {
      totalMoney = parseMoneyish(priceInput.value);
    }

    var totalCents = totalMoney != null ? Math.round(totalMoney * 100) : null;
    var tokenReady = cpcToken && cpcToken.value && cpcToken.value !== 'none';

    return {
      sqm: sqm,
      totalCents: totalCents,
      tokenReady: tokenReady
    };
  }

  function waitForCpc(form, callback) {
    var attempts = 0;
    var timer = setInterval(function () {
      var calc = getCpcCalculator(form);
      if (calc && cpcField(calc, 'Width')) {
        clearInterval(timer);
        callback(calc);
      } else if (++attempts > 60) {
        clearInterval(timer);
        callback(null);
      }
    }, 100);
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
    var sqmDisplay = root.querySelector('[data-dimension-sqm-display]');
    var priceDisplay = root.querySelector('[data-dimension-price-display]');
    var errEl = root.querySelector('[data-dimension-error]');

    var cpcCalc = null;

    var state = {
      variantPriceCents: null,
      variantAvailable: true,
      variant: null,
      sqm: null,
      totalCents: null,
      unitPriceCents: null
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

    function getQuantity() {
      if (!form) return 1;
      var qtyInput = form.querySelector('input[name="quantity"]');
      var qty = parseInt(qtyInput && qtyInput.value ? qtyInput.value : '1', 10);
      return isNaN(qty) || qty < 1 ? 1 : qty;
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
    }

    function updateSummary(sqm, unitPriceCents) {
      var sqmText = sqm != null ? sqm.toFixed(2) : '—';
      var priceText = unitPriceCents != null ? formatMoney(unitPriceCents) : 'Enter dimensions';

      if (sqmDisplay) {
        sqmDisplay.textContent = sqmText;
        sqmDisplay.classList.toggle('product-dimension-fields_summary-value--placeholder', sqm == null);
      }
      if (priceDisplay) {
        priceDisplay.textContent = priceText;
        priceDisplay.classList.toggle(
          'product-dimension-fields_summary-value--placeholder',
          unitPriceCents == null
        );
      }
    }

    function updatePriceDisplay(unitPriceCents) {
      var parent = getMainParent();
      if (!parent || !priceRenderSel) return;
      var priceWrap = parent.querySelector(priceRenderSel);
      if (!priceWrap) return;

      var mainPrice = priceWrap.querySelector('.main-price');
      if (!mainPrice) return;

      if (unitPriceCents == null) {
        mainPrice.textContent = 'Enter dimensions';
        return;
      }
      mainPrice.textContent = formatMoney(unitPriceCents);
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

      var qty = getQuantity();
      var unitCents = Math.round(totalCents / qty);
      quantityInput.dataset.variantPrice = String(unitCents);
      qtySubtotal.textContent = formatMoney(totalCents);
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

    function recalculateWithFallback(wn, hn, unit, qty) {
      var sqm = calculateSquareMeters(wn, hn, unit);
      var unitPriceCents = calculateTotalPrice(sqm, state.variantPriceCents);
      var totalCents = unitPriceCents != null ? unitPriceCents * qty : null;

      state.sqm = sqm;
      state.unitPriceCents = unitPriceCents;
      state.totalCents = totalCents;

      updateSummary(sqm, unitPriceCents);
      updatePriceDisplay(unitPriceCents);
      updateQuantitySubtotal(totalCents);
      setAtcEnabled(true);
      showError('');
    }

    function recalculate() {
      var w = (inpW && inpW.value.trim()) || '';
      var h = (inpH && inpH.value.trim()) || '';
      var unit = (selU && selU.value) || '';
      var validation = validateDimensions(w, h, unit);

      if (!validation.valid) {
        state.sqm = null;
        state.unitPriceCents = null;
        state.totalCents = null;
        setSummaryPlaceholder();
        updatePriceDisplay(null);
        updateQuantitySubtotal(null);
        setAtcEnabled(false);
        return validation;
      }

      var wn = parseInt(w, 10);
      var hn = parseInt(h, 10);
      var qty = getQuantity();

      if (cpcCalc) {
        syncToCpc(cpcCalc, form, {
          width: wn,
          height: hn,
          unit: unit,
          quantity: qty,
          variantPriceCents: state.variantPriceCents,
          variant: state.variant
        });

        var cpcResults = readCpcResults(cpcCalc, form);
        if (cpcResults && cpcResults.totalCents != null && cpcResults.totalCents > 0) {
          var unitPriceCents = Math.round(cpcResults.totalCents / qty);
          state.sqm = cpcResults.sqm;
          state.unitPriceCents = unitPriceCents;
          state.totalCents = cpcResults.totalCents;

          updateSummary(cpcResults.sqm, unitPriceCents);
          updatePriceDisplay(unitPriceCents);
          updateQuantitySubtotal(cpcResults.totalCents);
          setAtcEnabled(true);
          showError('');
          return validation;
        }
      }

      recalculateWithFallback(wn, hn, unit, qty);
      return validation;
    }

    function onVariantChange(variant) {
      if (!variant) return;
      state.variant = variant;
      state.variantPriceCents = variant.price;
      state.variantAvailable = variant.available !== false;
      if (cpcCalc) {
        syncCpcNumberInput(cpcCalc, variant.price);
        syncCpcTypePrice(cpcCalc, variant.price);
        syncCpcVariantId(form, variant);
      }
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
            return;
          }

          if (cpcCalc) {
            syncToCpc(cpcCalc, form, {
              width: parseInt(inpW.value.trim(), 10),
              height: parseInt(inpH.value.trim(), 10),
              unit: selU.value,
              quantity: getQuantity(),
              variantPriceCents: state.variantPriceCents,
              variant: state.variant
            });
          }
        },
        true
      );

      var qtyInput = form.querySelector('input[name="quantity"]');
      if (qtyInput) {
        qtyInput.addEventListener('change', function () {
          recalculate();
        });
        qtyInput.addEventListener('input', function () {
          recalculate();
        });
      }
    }

    setSummaryPlaceholder();
    updatePriceDisplay(null);
    updateQuantitySubtotal(null);
    setAtcEnabled(false);

    waitForCpc(form, function (calc) {
      cpcCalc = calc;
      if (!cpcCalc) return;

      if (state.variant) {
        syncCpcNumberInput(cpcCalc, state.variantPriceCents);
        syncCpcTypePrice(cpcCalc, state.variantPriceCents);
        syncCpcVariantId(form, state.variant);
      }

      recalculate();
    });

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
