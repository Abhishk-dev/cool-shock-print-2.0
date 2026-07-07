(function () {
  'use strict';

  var UNIT_TO_CPC_LABEL = {
    cm: 'cm',
    meters: 'meter',
    meter: 'meter',
    in: 'inches',
    inches: 'inches',
    ft: 'feet',
    feet: 'feet'
  };

  function waitForCalculator(callback, attempts) {
    var max = attempts || 60;
    var count = 0;

    function check() {
      var calc = document.getElementById('calculator');
      if (calc) {
        callback(calc);
        return;
      }
      count += 1;
      if (count >= max) {
        callback(null);
        return;
      }
      window.setTimeout(check, 250);
    }

    check();
  }

  function triggerCpcInput(field) {
    if (!field) return;
    if (typeof window.PriceUpdation === 'function') {
      window.PriceUpdation(field);
    }
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function triggerCpcSelect(field) {
    if (!field) return;
    if (typeof window.ChangeEvent === 'function') {
      window.ChangeEvent(null, field);
    }
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getCpcField(calc, name) {
    return (
      calc.querySelector('[data-calcname="' + name + '"]') ||
      calc.querySelector('[name="properties[' + name + ']"]')
    );
  }

  function setCpcSelectByLabel(select, label) {
    if (!select || !label) return false;
    var normalized = String(label).toLowerCase();
    var matched = false;

    Array.prototype.forEach.call(select.options, function (option) {
      var optionLabel = (option.dataset.label || option.textContent || '').trim().toLowerCase();
      if (optionLabel === normalized) {
        select.value = option.value;
        matched = true;
      }
    });

    return matched;
  }

  function formatDisplayPrice(text) {
    if (!text) return '';
    var cleaned = String(text).replace(/[^\d.,-]/g, '').trim();
    if (!cleaned) return '';
    if (window.Shopify && window.Shopify.formatMoney && window.money_format) {
      var numeric = parseFloat(cleaned.replace(/,/g, ''));
      if (!isNaN(numeric)) {
        return window.Shopify.formatMoney(Math.round(numeric * 100), window.money_format);
      }
    }
    return text;
  }

  function initProductCpcBridge(config) {
    var sectionId = config.sectionId;
    var root = document.querySelector('.product-dimension-fields[data-dimension-root="' + sectionId + '"]');
    if (!root) return;

    waitForCalculator(function (calc) {
      if (!calc) return;

      var formId = root.getAttribute('data-form-id');
      var form = document.getElementById(formId);
      var mainParentSel = root.getAttribute('data-main-parent');
      var priceRenderSel = root.getAttribute('data-price-render');

      var inpW = root.querySelector('[data-dimension-width]');
      var inpH = root.querySelector('[data-dimension-height]');
      var selU = root.querySelector('[data-dimension-units]');
      var sqmDisplay = root.querySelector('[data-dimension-sqm-display]');
      var priceDisplay = root.querySelector('[data-dimension-price-display]');

      var cpcWidth = getCpcField(calc, 'Width');
      var cpcHeight = getCpcField(calc, 'Height');
      var cpcUnits = getCpcField(calc, 'Measurement Units');
      var cpcType = getCpcField(calc, 'Type');
      var cpcQuantity = getCpcField(calc, 'Quantity');
      var variantIdCustom = document.getElementById('variantIdCustom');

      function getMainParent() {
        return mainParentSel ? document.querySelector(mainParentSel) : document;
      }

      function syncVariantId(variant) {
        if (!variant) return;
        if (variantIdCustom) {
          variantIdCustom.value = String(variant.id);
        }
        if (form) {
          var formVariantInput = form.querySelector('input[name="id"]:not(#variantIdCustom)');
          if (formVariantInput) {
            formVariantInput.value = String(variant.id);
          }
        }
      }

      function syncTypeFromVariant(variant) {
        if (!cpcType || !variant) return;

        var candidates = [];
        if (variant.option2) {
          candidates.push(String(variant.option2).split(' - ')[0].trim());
          candidates.push(variant.option2);
        }
        if (variant.option1) candidates.push(variant.option1);
        if (variant.title) candidates.push(variant.title);

        var matched = candidates.some(function (candidate) {
          return candidate && setCpcSelectByLabel(cpcType, candidate);
        });

        if (!matched && cpcType.options.length === 1) {
          cpcType.selectedIndex = 0;
          matched = true;
        }

        if (matched) {
          triggerCpcSelect(cpcType);
        }
      }

      function syncDimensionsToCpc() {
        if (cpcWidth && inpW) {
          cpcWidth.value = inpW.value || '0';
          triggerCpcInput(cpcWidth);
        }
        if (cpcHeight && inpH) {
          cpcHeight.value = inpH.value || '0';
          triggerCpcInput(cpcHeight);
        }
        if (cpcUnits && selU && selU.value) {
          var cpcLabel = UNIT_TO_CPC_LABEL[selU.value] || selU.value;
          setCpcSelectByLabel(cpcUnits, cpcLabel);
          triggerCpcSelect(cpcUnits);
        }
        if (cpcQuantity && form) {
          var themeQty = form.querySelector('input[name="quantity"]:not([data-dimension-quantity])');
          if (themeQty && themeQty.value) {
            cpcQuantity.value = themeQty.value;
            triggerCpcInput(cpcQuantity);
          }
        }
      }

      function syncDisplayFromCpc() {
        var sqmHidden = document.getElementById('calculation_inp_Total_Square_Meters');
        var priceHidden = document.getElementById('calculation_inp_Calculated_price');
        var priceTicker = document.getElementById('priceTicker');

        var sqmValue = sqmHidden ? sqmHidden.value : '';
        var priceValue = priceHidden ? priceHidden.value : '';
        var tickerText = priceTicker ? priceTicker.textContent.trim() : '';

        if (sqmDisplay) {
          if (sqmValue && parseFloat(sqmValue) > 0) {
            sqmDisplay.textContent = parseFloat(sqmValue).toFixed(2);
            sqmDisplay.classList.remove('product-dimension-fields_summary-value--placeholder');
          } else {
            sqmDisplay.textContent = '—';
            sqmDisplay.classList.add('product-dimension-fields_summary-value--placeholder');
          }
        }

        if (priceDisplay) {
          var displayPrice = tickerText || priceValue;
          if (displayPrice && parseFloat(String(displayPrice).replace(/[^\d.-]/g, '')) > 0) {
            priceDisplay.textContent = formatDisplayPrice(displayPrice);
            priceDisplay.classList.remove('product-dimension-fields_summary-value--placeholder');
          } else {
            priceDisplay.textContent = 'Enter dimensions';
            priceDisplay.classList.add('product-dimension-fields_summary-value--placeholder');
          }
        }

        var parent = getMainParent();
        if (parent && priceRenderSel) {
          var priceWrap = parent.querySelector(priceRenderSel);
          var mainPrice = priceWrap ? priceWrap.querySelector('.main-price') : null;
          if (mainPrice) {
            var mainDisplay = tickerText || priceValue;
            if (mainDisplay && parseFloat(String(mainDisplay).replace(/[^\d.-]/g, '')) > 0) {
              mainPrice.textContent = formatDisplayPrice(mainDisplay);
            }
          }
        }
      }

      function syncAll() {
        syncDimensionsToCpc();
        window.setTimeout(syncDisplayFromCpc, 50);
      }

      [inpW, inpH, selU].forEach(function (el) {
        if (!el) return;
        el.addEventListener('input', syncAll);
        el.addEventListener('change', syncAll);
      });

      if (form) {
        form.addEventListener(
          'submit',
          function () {
            syncAll();
          },
          true
        );

        var themeQty = form.querySelector('input[name="quantity"]:not([data-dimension-quantity])');
        if (themeQty) {
          themeQty.addEventListener('input', syncAll);
          themeQty.addEventListener('change', syncAll);
        }
      }

      document.addEventListener('cascade:variant-change', function (e) {
        if (!e.detail || String(e.detail.sectionId) !== String(sectionId)) return;
        syncVariantId(e.detail.variant);
        syncTypeFromVariant(e.detail.variant);
        syncAll();
      });

      var observer = new MutationObserver(function () {
        syncDisplayFromCpc();
      });

      ['priceTicker', 'calculator-final-value', 'calculation_inp_Total_Square_Meters', 'calculation_inp_Calculated_price'].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) {
          observer.observe(node, { childList: true, characterData: true, subtree: true, attributes: true });
        }
      });

      var initialVariantId = form ? form.querySelector('input[name="id"]') : null;
      if (initialVariantId) {
        var fullJsonEl = document.getElementById('CustomVariantsFull-' + sectionId);
        if (fullJsonEl) {
          try {
            var variants = JSON.parse(fullJsonEl.textContent);
            var current = variants.find(function (v) {
              return String(v.id) === String(initialVariantId.value);
            });
            if (current) {
              syncVariantId(current);
              syncTypeFromVariant(current);
            }
          } catch (err) {
            /* ignore */
          }
        }
      }

      syncAll();
      window.setInterval(syncDisplayFromCpc, 500);
    });
  }

  window.initProductCpcBridge = initProductCpcBridge;
})();
