import y, { useContext as pe, useCallback as g, memo as F, useState as $, useRef as E, useLayoutEffect as Q, useEffect as T, forwardRef as Me, useImperativeHandle as Be, cloneElement as $e } from "react";
import { createPortal as we } from "react-dom";
var _ = /* @__PURE__ */ ((e) => (e[e.Edit = 0] = "Edit", e[e.Source = 1] = "Source", e))(_ || {});
function fe({ image: e, width: t, height: s, history: i, bounds: r }) {
  return new Promise((o, n) => {
    const c = document.createElement("canvas"), f = r.width * window.devicePixelRatio, h = r.height * window.devicePixelRatio;
    c.width = f, c.height = h;
    const a = c.getContext("2d");
    if (!a)
      return n(new Error("convert image to blob fail"));
    const l = e.naturalWidth / t, u = e.naturalHeight / s;
    a.imageSmoothingEnabled = !0, a.imageSmoothingQuality = "low", a.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0), a.clearRect(0, 0, r.width, r.height), a.drawImage(
      e,
      r.x * l,
      r.y * u,
      r.width * l,
      r.height * u,
      0,
      0,
      r.width,
      r.height
    ), i.stack.slice(0, i.index + 1).forEach((d) => {
      d.type === _.Source && d.draw(a, d);
    }), c.toBlob((d) => {
      if (!d)
        return n(new Error("canvas toBlob fail"));
      o(d);
    }, "image/png");
  });
}
const Re = {
  magnifier_position_label: "坐标",
  operation_ok_title: "确定",
  operation_cancel_title: "取消",
  operation_save_title: "保存",
  operation_redo_title: "重做",
  operation_undo_title: "撤销",
  operation_mosaic_title: "马赛克",
  operation_text_title: "文本",
  operation_brush_title: "画笔",
  operation_arrow_title: "箭头",
  operation_ellipse_title: "椭圆",
  operation_rectangle_title: "矩形"
}, ye = y.createContext({
  store: {
    url: void 0,
    image: null,
    width: 0,
    height: 0,
    lang: Re,
    emiterRef: { current: {} },
    canvasContextRef: { current: null },
    history: {
      index: -1,
      stack: []
    },
    bounds: null,
    cursor: "move",
    operation: void 0
  },
  dispatcher: {
    call: void 0,
    setHistory: void 0,
    setBounds: void 0,
    setCursor: void 0,
    setOperation: void 0
  }
});
function se() {
  const { dispatcher: e } = pe(ye);
  return e;
}
function Y() {
  const { store: e } = pe(ye);
  return e;
}
function K() {
  const { bounds: e } = Y(), { setBounds: t } = se(), s = g(
    (r) => {
      t == null || t(r);
    },
    [t]
  ), i = g(() => {
    t == null || t(null);
  }, [t]);
  return [
    e,
    {
      set: s,
      reset: i
    }
  ];
}
function O() {
  const { lang: e } = Y();
  return e;
}
const q = 100, G = 80, De = F(function({ x: t, y: s }) {
  const { width: i, height: r, image: o } = Y(), n = O(), [c, f] = $(null), h = E(null), a = E(null), l = E(null), [u, d] = $("000000");
  return Q(() => {
    if (!h.current)
      return;
    const p = h.current.getBoundingClientRect();
    let w = t + 20, S = s + 20;
    w + p.width > i && (w = t - p.width - 20), S + p.height > r && (S = s - p.height - 20), w < 0 && (w = 0), S < 0 && (S = 0), f({
      x: w,
      y: S
    });
  }, [i, r, t, s]), T(() => {
    if (!o || !a.current) {
      l.current = null;
      return;
    }
    if (l.current || (l.current = a.current.getContext("2d")), !l.current)
      return;
    const p = l.current;
    p.clearRect(0, 0, q, G);
    const w = o.naturalWidth / i, S = o.naturalHeight / r;
    p.drawImage(
      o,
      t * w - q / 2,
      s * S - G / 2,
      q,
      G,
      0,
      0,
      q,
      G
    );
    const { data: R } = p.getImageData(Math.floor(q / 2), Math.floor(G / 2), 1, 1), b = Array.from(R.slice(0, 3)).map((M) => M >= 16 ? M.toString(16) : `0${M.toString(16)}`).join("").toUpperCase();
    d(b);
  }, [i, r, o, t, s]), /* @__PURE__ */ y.createElement(
    "div",
    {
      ref: h,
      className: "screenshots-magnifier",
      style: {
        transform: `translate(${c == null ? void 0 : c.x}px, ${c == null ? void 0 : c.y}px)`
      }
    },
    /* @__PURE__ */ y.createElement("div", { className: "screenshots-magnifier-body" }, /* @__PURE__ */ y.createElement(
      "canvas",
      {
        ref: a,
        className: "screenshots-magnifier-body-canvas",
        width: q,
        height: G
      }
    )),
    /* @__PURE__ */ y.createElement("div", { className: "screenshots-magnifier-footer" }, /* @__PURE__ */ y.createElement("div", { className: "screenshots-magnifier-footer-item" }, n.magnifier_position_label, ": (", t, ",", s, ")"), /* @__PURE__ */ y.createElement("div", { className: "screenshots-magnifier-footer-item" }, "RGB: #", u))
  );
});
function _e({ x: e, y: t }, { x: s, y: i }, r, o) {
  return e > s && ([e, s] = [s, e]), t > i && ([t, i] = [i, t]), e < 0 && (e = 0), s > r && (s = r), t < 0 && (t = 0), i > o && (i = o), {
    x: e,
    y: t,
    width: s - e,
    height: i - t
  };
}
const Pe = F(function() {
  const { url: t, image: s, width: i, height: r } = Y(), [o, n] = K(), c = E(null), f = E(null), h = E(!1), [a, l] = $(null), u = g(
    (p, w) => {
      if (!c.current)
        return;
      const { x: S, y: R } = c.current.getBoundingClientRect();
      n.set(
        _e(
          {
            x: p.x - S,
            y: p.y - R
          },
          {
            x: w.x - S,
            y: w.y - R
          },
          i,
          r
        )
      );
    },
    [i, r, n]
  ), d = g(
    (p) => {
      f.current || o || p.button !== 0 || (f.current = {
        x: p.clientX,
        y: p.clientY
      }, h.current = !1);
    },
    [o]
  );
  return T(() => {
    const p = (S) => {
      if (c.current) {
        const R = c.current.getBoundingClientRect();
        S.clientX < R.left || S.clientY < R.top || S.clientX > R.right || S.clientY > R.bottom ? l(null) : l({
          x: S.clientX - R.x,
          y: S.clientY - R.y
        });
      }
      f.current && (u(f.current, {
        x: S.clientX,
        y: S.clientY
      }), h.current = !0);
    }, w = (S) => {
      f.current && (h.current && u(f.current, {
        x: S.clientX,
        y: S.clientY
      }), f.current = null, h.current = !1);
    };
    return window.addEventListener("mousemove", p), window.addEventListener("mouseup", w), () => {
      window.removeEventListener("mousemove", p), window.removeEventListener("mouseup", w);
    };
  }, [u]), Q(() => {
    (!s || o) && l(null);
  }, [s, o]), !t || !s ? null : /* @__PURE__ */ y.createElement("div", { ref: c, className: "screenshots-background", onMouseDown: d }, /* @__PURE__ */ y.createElement("img", { className: "screenshots-background-image", src: t }), /* @__PURE__ */ y.createElement("div", { className: "screenshots-background-mask" }), a && !o && /* @__PURE__ */ y.createElement(De, { x: a == null ? void 0 : a.x, y: a == null ? void 0 : a.y }));
});
function j() {
  const { cursor: e } = Y(), { setCursor: t } = se(), s = g(
    (r) => {
      t == null || t(r);
    },
    [t]
  ), i = g(() => {
    t == null || t("move");
  }, [t]);
  return [
    e,
    {
      set: s,
      reset: i
    }
  ];
}
function Z() {
  const { emiterRef: e } = Y(), t = g(
    (o, n) => {
      const c = e.current;
      Array.isArray(c[o]) ? c[o].push(n) : c[o] = [n];
    },
    [e]
  ), s = g(
    (o, n) => {
      const c = e.current;
      if (Array.isArray(c[o])) {
        const f = c[o].findIndex((h) => h === n);
        f !== -1 && c[o].splice(f, 1);
      }
    },
    [e]
  ), i = g(
    (o, ...n) => {
      const c = e.current;
      Array.isArray(c[o]) && c[o].forEach((f) => f(...n));
    },
    [e]
  ), r = g(() => {
    e.current = {};
  }, [e]);
  return {
    on: t,
    off: s,
    emit: i,
    reset: r
  };
}
function H() {
  const { history: e } = Y(), { setHistory: t } = se(), s = g(
    (a) => {
      const { index: l, stack: u } = e;
      u.forEach((d) => {
        d.type === _.Source && (d.isSelected = !1);
      }), a.type === _.Source ? a.isSelected = !0 : a.type === _.Edit && (a.source.isSelected = !0), u.splice(l + 1), u.push(a), t == null || t({
        index: u.length - 1,
        stack: u
      });
    },
    [e, t]
  ), i = g(() => {
    const { stack: a } = e;
    a.pop(), t == null || t({
      index: a.length - 1,
      stack: a
    });
  }, [e, t]), r = g(() => {
    const { index: a, stack: l } = e, u = l[a];
    u && (u.type === _.Source ? u.isSelected = !1 : u.type === _.Edit && u.source.editHistory.pop()), t == null || t({
      index: a <= 0 ? -1 : a - 1,
      stack: l
    });
  }, [e, t]), o = g(() => {
    const { index: a, stack: l } = e, u = l[a + 1];
    u && (u.type === _.Source ? u.isSelected = !1 : u.type === _.Edit && u.source.editHistory.push(u)), t == null || t({
      index: a >= l.length - 1 ? l.length - 1 : a + 1,
      stack: l
    });
  }, [e, t]), n = g(
    (a) => {
      t == null || t({ ...a });
    },
    [t]
  ), c = g(
    (a) => {
      e.stack.forEach((l) => {
        l.type === _.Source && (l === a ? l.isSelected = !0 : l.isSelected = !1);
      }), t == null || t({ ...e });
    },
    [e, t]
  ), f = g(() => {
    e.stack.forEach((a) => {
      a.type === _.Source && (a.isSelected = !1);
    }), t == null || t({ ...e });
  }, [e, t]), h = g(() => {
    t == null || t({
      index: -1,
      stack: []
    });
  }, [t]);
  return [
    {
      index: e.index,
      stack: e.stack,
      top: e.stack.slice(e.index, e.index + 1)[0]
    },
    {
      push: s,
      pop: i,
      undo: r,
      redo: o,
      set: n,
      select: c,
      clearSelect: f,
      reset: h
    }
  ];
}
function J() {
  const { operation: e } = Y(), { setOperation: t } = se(), s = g(
    (r) => {
      t == null || t(r);
    },
    [t]
  ), i = g(() => {
    t == null || t(void 0);
  }, [t]);
  return [
    e,
    {
      set: s,
      reset: i
    }
  ];
}
function Xe({ x: e, y: t }, { x: s, y: i }, r, o, n, c) {
  return e > s && ([e, s] = [s, e]), t > i && ([t, i] = [i, t]), e < 0 && (e = 0, c === "move" && (s = r.width)), s > o && (s = o, c === "move" && (e = s - r.width)), t < 0 && (t = 0, c === "move" && (i = r.height)), i > n && (i = n, c === "move" && (t = i - r.height)), {
    x: e,
    y: t,
    width: Math.max(s - e, 1),
    height: Math.max(i - t, 1)
  };
}
function Ne(e, t, s, i) {
  const r = e.clientX - s.x, o = e.clientY - s.y;
  let n = i.x, c = i.y, f = i.x + i.width, h = i.y + i.height;
  switch (t) {
    case "top":
      c += o;
      break;
    case "top-right":
      f += r, c += o;
      break;
    case "right":
      f += r;
      break;
    case "right-bottom":
      f += r, h += o;
      break;
    case "bottom":
      h += o;
      break;
    case "bottom-left":
      n += r, h += o;
      break;
    case "left":
      n += r;
      break;
    case "left-top":
      n += r, c += o;
      break;
    case "move":
      n += r, c += o, f += r, h += o;
      break;
  }
  return [
    {
      x: n,
      y: c
    },
    {
      x: f,
      y: h
    }
  ];
}
function Ye(e, t, s, i) {
  if (!t)
    return !1;
  const r = document.createElement("canvas");
  r.width = e.width, r.height = e.height;
  const o = r.getContext("2d");
  if (!o)
    return !1;
  const { left: n, top: c } = t.getBoundingClientRect(), f = i.clientX - n, h = i.clientY - c;
  return [...s.stack.slice(0, s.index + 1)].reverse().find((l) => {
    var u;
    return l.type !== _.Source ? !1 : (o.clearRect(0, 0, e.width, e.height), (u = l.isHit) == null ? void 0 : u.call(l, o, l, { x: f, y: h }));
  });
}
const Le = ["top", "right", "bottom", "left"], Te = [
  "top",
  "top-right",
  "right",
  "right-bottom",
  "bottom",
  "bottom-left",
  "left",
  "left-top"
  /* ResizeLeftTop */
], He = F(
  Me(function(t, s) {
    const { url: i, image: r, width: o, height: n } = Y(), c = Z(), [f] = H(), [h] = j(), [a, l] = K(), [u] = J(), d = E(), p = E(null), w = E(null), S = E(null), R = E(null), b = a && !f.stack.length && !u, M = g(() => {
      if (!a || !R.current)
        return;
      const x = R.current;
      x.imageSmoothingEnabled = !0, x.imageSmoothingQuality = "low", x.clearRect(0, 0, a.width, a.height), f.stack.slice(0, f.index + 1).forEach((C) => {
        C.type === _.Source && C.draw(x, C);
      });
    }, [a, R, f]), v = g(
      (x, C) => {
        if (!(x.button !== 0 || !a))
          if (!u)
            d.current = C, p.current = {
              x: x.clientX,
              y: x.clientY
            }, w.current = {
              x: a.x,
              y: a.y,
              width: a.width,
              height: a.height
            };
          else {
            const z = Ye(
              a,
              S.current,
              f,
              x.nativeEvent
            );
            z ? c.emit("drawselect", z, x.nativeEvent) : c.emit("mousedown", x.nativeEvent);
          }
      },
      [a, u, c, f]
    ), m = g(
      (x) => {
        if (!d.current || !p.current || !w.current || !a)
          return;
        const C = Ne(
          x,
          d.current,
          p.current,
          w.current
        );
        l.set(
          Xe(
            C[0],
            C[1],
            a,
            o,
            n,
            d.current
          )
        );
      },
      [o, n, a, l]
    );
    return Q(() => {
      if (!r || !a || !S.current) {
        R.current = null;
        return;
      }
      R.current || (R.current = S.current.getContext("2d")), M();
    }, [r, a, M]), T(() => {
      const x = (z) => {
        if (u)
          c.emit("mousemove", z);
        else {
          if (!d.current || !p.current || !w.current)
            return;
          m(z);
        }
      }, C = (z) => {
        if (u)
          c.emit("mouseup", z);
        else {
          if (!d.current || !p.current || !w.current)
            return;
          m(z), d.current = void 0, p.current = null, w.current = null;
        }
      };
      return window.addEventListener("mousemove", x), window.addEventListener("mouseup", C), () => {
        window.removeEventListener("mousemove", x), window.removeEventListener("mouseup", C);
      };
    }, [m, u, c]), Be(s, () => R.current), /* @__PURE__ */ y.createElement(
      "div",
      {
        className: "screenshots-canvas",
        style: {
          width: (a == null ? void 0 : a.width) || 0,
          height: (a == null ? void 0 : a.height) || 0,
          transform: a ? `translate(${a.x}px, ${a.y}px)` : "none"
        }
      },
      /* @__PURE__ */ y.createElement("div", { className: "screenshots-canvas-body" }, /* @__PURE__ */ y.createElement(
        "img",
        {
          className: "screenshots-canvas-image",
          src: i,
          style: {
            width: o,
            height: n,
            transform: a ? `translate(${-a.x}px, ${-a.y}px)` : "none"
          }
        }
      ), /* @__PURE__ */ y.createElement(
        "canvas",
        {
          ref: S,
          className: "screenshots-canvas-panel",
          width: (a == null ? void 0 : a.width) || 0,
          height: (a == null ? void 0 : a.height) || 0
        }
      )),
      /* @__PURE__ */ y.createElement(
        "div",
        {
          className: "screenshots-canvas-mask",
          style: {
            cursor: h
          },
          onMouseDown: (x) => v(x, "move")
        },
        b && /* @__PURE__ */ y.createElement("div", { className: "screenshots-canvas-size" }, a.width, " × ", a.height)
      ),
      Le.map((x) => /* @__PURE__ */ y.createElement(
        "div",
        {
          key: x,
          className: `screenshots-canvas-border-${x}`
        }
      )),
      b && Te.map((x) => /* @__PURE__ */ y.createElement(
        "div",
        {
          key: x,
          className: `screenshots-canvas-point-${x}`,
          onMouseDown: (C) => v(C, x)
        }
      ))
    );
  })
);
function ve() {
  const e = se();
  return g(
    (s, ...i) => {
      var r;
      (r = e.call) == null || r.call(e, s, ...i);
    },
    [e]
  );
}
function U() {
  const { canvasContextRef: e } = Y();
  return e;
}
function xe() {
  const e = Z(), [, t] = K(), [, s] = j(), [, i] = H(), [, r] = J();
  return g(() => {
    e.reset(), i.reset(), t.reset(), s.reset(), r.reset();
  }, [e, i, t, s, r]);
}
const Ae = F(function({ open: t, content: s, children: i }) {
  const r = E(null), o = E(null), n = E(null), c = pe(Ee), [f, h] = $(
    "bottom"
    /* Bottom */
  ), [a, l] = $(null), [u, d] = $(0), p = () => (o.current || (o.current = document.createElement("div")), o.current);
  return T(() => {
    const w = p();
    return t && document.body.appendChild(w), () => {
      w.remove();
    };
  }, [t]), T(() => {
    if (!t || !c || !r.current || !n.current)
      return;
    const w = r.current.getBoundingClientRect(), S = n.current.getBoundingClientRect();
    let R = f, b = w.left + w.width / 2, M = w.top + w.height, v = u;
    if (b + S.width / 2 > c.x + c.width) {
      const m = b;
      b = c.x + c.width - S.width / 2, v = m - b;
    }
    if (b < c.x + S.width / 2) {
      const m = b;
      b = c.x + S.width / 2, v = m - b;
    }
    M > window.innerHeight - S.height && (R === "bottom" && (R = "top"), M = w.top - S.height), M < 0 && (R === "top" && (R = "bottom"), M = w.top + w.height), R !== f && h(R), ((a == null ? void 0 : a.x) !== b || a.y !== M) && l({
      x: b,
      y: M
    }), v !== u && d(v);
  }), /* @__PURE__ */ y.createElement(y.Fragment, null, $e(i, {
    ref: r
  }), t && s && we(
    /* @__PURE__ */ y.createElement(
      "div",
      {
        ref: n,
        className: "screenshots-option",
        style: {
          visibility: a ? "visible" : "hidden",
          transform: `translate(${(a == null ? void 0 : a.x) ?? 0}px, ${(a == null ? void 0 : a.y) ?? 0}px)`
        },
        "data-placement": f
      },
      /* @__PURE__ */ y.createElement("div", { className: "screenshots-option-container" }, s),
      /* @__PURE__ */ y.createElement("div", { className: "screenshots-option-arrow", style: { marginLeft: u } })
    ),
    p()
  ));
});
const A = F(function({
  title: t,
  icon: s,
  checked: i,
  disabled: r,
  option: o,
  onClick: n
}) {
  const c = ["screenshots-button"], f = g(
    (h) => {
      r || !n || n(h);
    },
    [r, n]
  );
  return i && c.push("screenshots-button-checked"), r && c.push("screenshots-button-disabled"), /* @__PURE__ */ y.createElement(Ae, { open: i, content: o }, /* @__PURE__ */ y.createElement(
    "div",
    {
      className: c.join(" "),
      title: t,
      onClick: f
    },
    /* @__PURE__ */ y.createElement("span", { className: s })
  ));
});
function Ie() {
  const { image: e, width: t, height: s, history: i, bounds: r, lang: o } = Y(), n = U(), [, c] = H(), f = ve(), h = xe(), a = g(() => {
    c.clearSelect(), setTimeout(() => {
      !n.current || !e || !r || fe({
        image: e,
        width: t,
        height: s,
        history: i,
        bounds: r
      }).then((l) => {
        f("onOk", l, r), h();
      });
    });
  }, [n, c, e, t, s, i, r, f, h]);
  return /* @__PURE__ */ y.createElement(A, { title: o.operation_ok_title, icon: "icon-ok", onClick: a });
}
function We() {
  const e = ve(), t = xe(), s = O(), i = g(() => {
    e("onCancel"), t();
  }, [e, t]);
  return /* @__PURE__ */ y.createElement(A, { title: s.operation_cancel_title, icon: "icon-cancel", onClick: i });
}
function Fe() {
  const { image: e, width: t, height: s, history: i, bounds: r, lang: o } = Y(), n = U(), [, c] = H(), f = ve(), h = xe(), a = g(() => {
    c.clearSelect(), setTimeout(() => {
      !n.current || !e || !r || fe({
        image: e,
        width: t,
        height: s,
        history: i,
        bounds: r
      }).then((l) => {
        f("onSave", l, r), h();
      });
    });
  }, [n, c, e, t, s, i, r, f, h]);
  return /* @__PURE__ */ y.createElement(A, { title: o.operation_save_title, icon: "icon-save", onClick: a });
}
function Oe() {
  const e = O(), [t, s] = H(), i = g(() => {
    s.redo();
  }, [s]);
  return /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_redo_title,
      icon: "icon-redo",
      disabled: !t.stack.length || t.stack.length - 1 === t.index,
      onClick: i
    }
  );
}
function Ve() {
  const e = O(), [t, s] = H(), i = g(() => {
    s.undo();
  }, [s]);
  return /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_undo_title,
      icon: "icon-undo",
      disabled: t.index === -1,
      onClick: i
    }
  );
}
const Se = F(function({ value: t, onChange: s }) {
  const i = [3, 6, 9];
  return /* @__PURE__ */ y.createElement("div", { className: "screenshots-size" }, i.map((r) => {
    const o = ["screenshots-size-item"];
    return r === t && o.push("screenshots-size-active"), /* @__PURE__ */ y.createElement("div", { key: r, className: o.join(" "), onClick: () => s && s(r) }, /* @__PURE__ */ y.createElement(
      "div",
      {
        className: "screenshots-size-pointer",
        style: {
          width: r * 1.8,
          height: r * 1.8
        }
      }
    ));
  }));
});
function ee(e) {
  const t = Z();
  T(() => (t.on("mousedown", e), () => {
    t.off("mousedown", e);
  }), [e, t]);
}
function te(e) {
  const t = Z();
  T(() => (t.on("mousemove", e), () => {
    t.off("mousemove", e);
  }), [e, t]);
}
function ne(e) {
  const t = Z();
  T(() => (t.on("mouseup", e), () => {
    t.off("mouseup", e);
  }), [e, t]);
}
function le(e, t, s) {
  if (!s)
    return [0, 0, 0, 0];
  const { data: i, width: r } = s, o = t * r * 4 + e * 4;
  return Array.from(i.slice(o, o + 4));
}
function je(e, t) {
  const { tiles: s, size: i } = t.data;
  s.forEach((r) => {
    const o = Math.round(r.color[0]), n = Math.round(r.color[1]), c = Math.round(r.color[2]), f = r.color[3] / 255;
    e.fillStyle = `rgba(${o}, ${n}, ${c}, ${f})`, e.fillRect(r.x - i / 2, r.y - i / 2, i, i);
  });
}
function Je() {
  const e = O(), { image: t, width: s, height: i } = Y(), [r, o] = J(), n = U(), [c, f] = H(), [h] = K(), [, a] = j(), [l, u] = $(3), d = E(null), p = E(null), w = r === "Mosaic", S = g(() => {
    o.set("Mosaic"), a.set("crosshair");
  }, [o, a]), R = g(() => {
    w || (S(), f.clearSelect());
  }, [w, S, f]), b = g(
    (m) => {
      if (!w || p.current || !d.current || !n.current)
        return;
      const x = n.current.canvas.getBoundingClientRect(), C = m.clientX - x.x, z = m.clientY - x.y, B = l * 2;
      p.current = {
        name: "Mosaic",
        type: _.Source,
        data: {
          size: B,
          tiles: [
            {
              x: C,
              y: z,
              color: le(C, z, d.current)
            }
          ]
        },
        editHistory: [],
        draw: je
      };
    },
    [w, l, n]
  ), M = g(
    (m) => {
      if (!w || !p.current || !n.current || !d.current)
        return;
      const x = n.current.canvas.getBoundingClientRect(), C = m.clientX - x.x, z = m.clientY - x.y, B = p.current.data.size, D = p.current.data.tiles;
      let k = D[D.length - 1];
      if (!k)
        D.push({
          x: C,
          y: z,
          color: le(C, z, d.current)
        });
      else {
        const ae = k.x - C, P = k.y - z;
        let L = Math.sqrt(ae ** 2 + P ** 2);
        const de = -P / L, me = -ae / L;
        for (; L > B; ) {
          const re = Math.floor(k.x + B * me), oe = Math.floor(k.y + B * de);
          k = {
            x: re,
            y: oe,
            color: le(re, oe, d.current)
          }, D.push(k), L -= B;
        }
        L > B / 2 && D.push({
          x: C,
          y: z,
          color: le(C, z, d.current)
        });
      }
      c.top !== p.current ? f.push(p.current) : f.set(c);
    },
    [w, n, c, f]
  ), v = g(() => {
    w && (p.current = null);
  }, [w]);
  return ee(b), te(M), ne(v), T(() => {
    if (!h || !t || !w)
      return;
    const m = document.createElement("canvas"), x = m.getContext("2d");
    if (!x)
      return;
    m.width = h.width, m.height = h.height;
    const C = t.naturalWidth / s, z = t.naturalHeight / i;
    x.drawImage(
      t,
      h.x * C,
      h.y * z,
      h.width * C,
      h.height * z,
      0,
      0,
      h.width,
      h.height
    ), d.current = x.getImageData(0, 0, h.width, h.height);
  }, [s, i, h, t, w]), /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_mosaic_title,
      icon: "icon-mosaic",
      checked: w,
      onClick: R,
      option: /* @__PURE__ */ y.createElement(Se, { value: l, onChange: u })
    }
  );
}
const Ue = F(function({ value: t, onChange: s }) {
  const i = ["#ee5126", "#fceb4d", "#90e746", "#51c0fa", "#7a7a7a", "#ffffff"];
  return /* @__PURE__ */ y.createElement("div", { className: "screenshots-color" }, i.map((r) => {
    const o = ["screenshots-color-item"];
    return r === t && o.push("screenshots-color-active"), /* @__PURE__ */ y.createElement(
      "div",
      {
        key: r,
        className: o.join(" "),
        style: { backgroundColor: r },
        onClick: () => s && s(r)
      }
    );
  }));
});
const ce = F(function({
  size: t,
  color: s,
  onSizeChange: i,
  onColorChange: r
}) {
  return /* @__PURE__ */ y.createElement("div", { className: "screenshots-sizecolor" }, /* @__PURE__ */ y.createElement(Se, { value: t, onChange: i }), /* @__PURE__ */ y.createElement(Ue, { value: s, onChange: r }));
}), qe = `
min-width: 0 !important;
width: 0 !important;
min-height: 0 !important;
height:0 !important;
visibility: hidden !important;
overflow: hidden !important;
position: absolute !important;
z-index: -1000 !important;
top:0 !important;
right:0 !important;
`, Ge = [
  "letter-spacing",
  "line-height",
  "padding-top",
  "padding-bottom",
  "font-family",
  "font-weight",
  "font-size",
  "font-variant",
  "text-rendering",
  "text-transform",
  "text-indent",
  "padding-left",
  "padding-right",
  "border-width",
  "box-sizing",
  "white-space",
  "word-break"
];
let V;
function Qe(e) {
  const t = window.getComputedStyle(e), s = t.getPropertyValue("box-sizing") || t.getPropertyValue("-moz-box-sizing") || t.getPropertyValue("-webkit-box-sizing"), i = parseFloat(t.getPropertyValue("padding-bottom")) + parseFloat(t.getPropertyValue("padding-top")), r = parseFloat(t.getPropertyValue("border-bottom-width")) + parseFloat(t.getPropertyValue("border-top-width"));
  return {
    sizingStyle: Ge.map((n) => `${n}:${t.getPropertyValue(n)}`).join(";"),
    paddingSize: i,
    borderSize: r,
    boxSizing: s
  };
}
function Ke(e, t, s, i) {
  V || (V = document.createElement("textarea"), V.setAttribute("tab-index", "-1"), document.body.appendChild(V));
  const { paddingSize: r, borderSize: o, boxSizing: n, sizingStyle: c } = Qe(e);
  V.setAttribute(
    "style",
    `${c};${qe};max-width:${s}px;max-height:${i}px`
  ), V.value = t || " ";
  let f = V.scrollWidth, h = V.scrollHeight;
  return n === "border-box" ? (f += o, h += o) : n === "content-box" && (f -= r, h -= r), {
    width: Math.min(f, s),
    height: Math.min(h, i)
  };
}
const Ze = F(function({
  x: t,
  y: s,
  maxWidth: i,
  maxHeight: r,
  size: o,
  color: n,
  value: c,
  onChange: f,
  onBlur: h
}) {
  const a = E(null), l = E(null), [u, d] = $(0), [p, w] = $(0), S = () => (a.current || (a.current = document.createElement("div")), a.current);
  return Q(() => (a.current && (document.body.appendChild(a.current), requestAnimationFrame(() => {
    var R;
    (R = l.current) == null || R.focus();
  })), () => {
    var R;
    (R = a.current) == null || R.remove();
  }), []), Q(() => {
    if (!l.current)
      return;
    const { width: R, height: b } = Ke(l.current, c, i, r);
    d(R), w(b);
  }, [c, i, r]), we(
    /* @__PURE__ */ y.createElement(
      "textarea",
      {
        ref: l,
        className: "screenshots-textarea",
        style: {
          color: n,
          width: u,
          height: p,
          maxWidth: i,
          maxHeight: r,
          fontSize: o,
          lineHeight: `${o}px`,
          transform: `translate(${t}px, ${s}px)`
        },
        value: c,
        onChange: (R) => f && f(R.target.value),
        onBlur: (R) => h && h(R)
      }
    ),
    S()
  );
});
function ie(e) {
  const t = Z();
  T(() => (t.on("drawselect", e), () => {
    t.off("drawselect", e);
  }), [e, t]);
}
const ge = {
  3: 18,
  6: 32,
  9: 46
};
function et(e, t) {
  const { size: s, color: i, fontFamily: r, x: o, y: n, text: c } = t.data;
  e.fillStyle = i, e.textAlign = "left", e.textBaseline = "top", e.font = `${s}px ${r}`;
  const f = t.editHistory.reduce(
    (h, { data: a }) => ({
      x: h.x + a.x2 - a.x1,
      y: h.y + a.y2 - a.y1
    }),
    { x: 0, y: 0 }
  );
  c.split(`
`).forEach((h, a) => {
    e.fillText(h, o + f.x, n + f.y + a * s);
  });
}
function tt(e, t, s) {
  e.textAlign = "left", e.textBaseline = "top", e.font = `${t.data.size}px ${t.data.fontFamily}`;
  let i = 0, r = 0;
  t.data.text.split(`
`).forEach((l) => {
    const u = e.measureText(l);
    i < u.width && (i = u.width), r += t.data.size;
  });
  const { x: o, y: n } = t.editHistory.reduce(
    (l, { data: u }) => ({
      x: l.x + u.x2 - u.x1,
      y: l.y + u.y2 - u.y1
    }),
    { x: 0, y: 0 }
  ), c = t.data.x + o, f = t.data.y + n, h = c + i, a = f + r;
  return s.x >= c && s.x <= h && s.y >= f && s.y <= a;
}
function nt() {
  const e = O(), [t, s] = H(), [i] = K(), [r, o] = J(), [, n] = j(), c = U(), [f, h] = $(3), [a, l] = $("#ee5126"), u = E(
    null
  ), d = E(
    null
  ), [p, w] = $(
    null
  ), [S, R] = $(""), b = r === "Text", M = g(() => {
    o.set("Text"), n.set("default");
  }, [o, n]), v = g(() => {
    b || (M(), s.clearSelect());
  }, [b, M, s]), m = g((P) => {
    u.current && (u.current.data.size = ge[P]), h(P);
  }, []), x = g((P) => {
    u.current && (u.current.data.color = P), l(P);
  }, []), C = g(
    (P) => {
      R(P), b && u.current && (u.current.data.text = P);
    },
    [b]
  ), z = g(() => {
    u.current && u.current.data.text && s.push(u.current), u.current = null, R(""), w(null);
  }, [s]), B = g(
    (P, L) => {
      P.name === "Text" && (M(), d.current = {
        type: _.Edit,
        data: {
          x1: L.clientX,
          y1: L.clientY,
          x2: L.clientX,
          y2: L.clientY
        },
        source: P
      }, s.select(P));
    },
    [M, s]
  ), D = g(
    (P) => {
      if (!b || !c.current || u.current || !i)
        return;
      const { left: L, top: de } = c.current.canvas.getBoundingClientRect(), me = window.getComputedStyle(
        c.current.canvas
      ).fontFamily, re = P.clientX - L, oe = P.clientY - de;
      u.current = {
        name: "Text",
        type: _.Source,
        data: {
          size: ge[f],
          color: a,
          fontFamily: me,
          x: re,
          y: oe,
          text: ""
        },
        editHistory: [],
        draw: et,
        isHit: tt
      }, w({
        x: P.clientX,
        y: P.clientY,
        maxWidth: i.width - re,
        maxHeight: i.height - oe
      });
    },
    [b, f, a, i, c]
  ), k = g(
    (P) => {
      b && d.current && (d.current.data.x2 = P.clientX, d.current.data.y2 = P.clientY, t.top !== d.current ? (d.current.source.editHistory.push(d.current), s.push(d.current)) : s.set(t));
    },
    [b, t, s]
  ), ae = g(() => {
    b && (d.current = null);
  }, [b]);
  return ie(B), ee(D), te(k), ne(ae), /* @__PURE__ */ y.createElement(y.Fragment, null, /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_text_title,
      icon: "icon-text",
      checked: b,
      onClick: v,
      option: /* @__PURE__ */ y.createElement(
        ce,
        {
          size: f,
          color: a,
          onSizeChange: m,
          onColorChange: x
        }
      )
    }
  ), b && p && /* @__PURE__ */ y.createElement(
    Ze,
    {
      x: p.x,
      y: p.y,
      maxWidth: p.maxWidth,
      maxHeight: p.maxHeight,
      size: ge[f],
      color: a,
      value: S,
      onChange: C,
      onBlur: z
    }
  ));
}
const Ce = 4;
function X(e, t, s) {
  e.lineWidth = 1, e.strokeStyle = "#000000", e.fillStyle = "#ffffff", e.beginPath(), e.arc(t, s, Ce, 0, 2 * Math.PI), e.fill(), e.stroke();
}
function he(e, t, s) {
  t.draw(e, t);
  const { data: i } = e.getImageData(s.x, s.y, 1, 1);
  return i.some((r) => r !== 0);
}
function N(e, t, s) {
  if (!e)
    return !1;
  const { left: i, top: r } = e.getBoundingClientRect(), o = t.clientX - i, n = t.clientY - r;
  return (s.x - o) ** 2 + (s.y - n) ** 2 < Ce ** 2;
}
function rt(e, t) {
  const { size: s, color: i, points: r } = t.data;
  e.lineCap = "round", e.lineJoin = "round", e.lineWidth = s, e.strokeStyle = i;
  const o = t.editHistory.reduce(
    (n, { data: c }) => ({
      x: n.x + c.x2 - c.x1,
      y: n.y + c.y2 - c.y1
    }),
    { x: 0, y: 0 }
  );
  e.beginPath(), r.forEach((n, c) => {
    c === 0 ? e.moveTo(n.x + o.x, n.y + o.y) : e.lineTo(n.x + o.x, n.y + o.y);
  }), e.stroke(), t.isSelected && (e.lineWidth = 1, e.strokeStyle = "#000000", e.beginPath(), r.forEach((n, c) => {
    c === 0 ? e.moveTo(n.x + o.x, n.y + o.y) : e.lineTo(n.x + o.x, n.y + o.y);
  }), e.stroke());
}
function ot() {
  const e = O(), [, t] = j(), [s, i] = J(), r = U(), [o, n] = H(), [c, f] = $(3), [h, a] = $("#ee5126"), l = E(null), u = E(null), d = s === "Brush", p = g(() => {
    i.set("Brush"), t.set("default");
  }, [i, t]), w = g(() => {
    d || (p(), n.clearSelect());
  }, [d, p, n]), S = g(
    (v, m) => {
      v.name === "Brush" && (p(), u.current = {
        type: _.Edit,
        data: {
          x1: m.clientX,
          y1: m.clientY,
          x2: m.clientX,
          y2: m.clientY
        },
        source: v
      }, n.select(v));
    },
    [p, n]
  ), R = g(
    (v) => {
      if (!d || l.current || !r.current)
        return;
      const { left: m, top: x } = r.current.canvas.getBoundingClientRect();
      l.current = {
        name: "Brush",
        type: _.Source,
        data: {
          size: c,
          color: h,
          points: [
            {
              x: v.clientX - m,
              y: v.clientY - x
            }
          ]
        },
        editHistory: [],
        draw: rt,
        isHit: he
      };
    },
    [d, r, c, h]
  ), b = g(
    (v) => {
      if (!(!d || !r.current)) {
        if (u.current)
          u.current.data.x2 = v.clientX, u.current.data.y2 = v.clientY, o.top !== u.current ? (u.current.source.editHistory.push(u.current), n.push(u.current)) : n.set(o);
        else if (l.current) {
          const { left: m, top: x } = r.current.canvas.getBoundingClientRect();
          l.current.data.points.push({
            x: v.clientX - m,
            y: v.clientY - x
          }), o.top !== l.current ? n.push(l.current) : n.set(o);
        }
      }
    },
    [d, o, r, n]
  ), M = g(() => {
    d && (l.current && n.clearSelect(), l.current = null, u.current = null);
  }, [d, n]);
  return ie(S), ee(R), te(b), ne(M), /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_brush_title,
      icon: "icon-brush",
      checked: d,
      onClick: w,
      option: /* @__PURE__ */ y.createElement(ce, { size: c, color: h, onSizeChange: f, onColorChange: a })
    }
  );
}
function ze(e) {
  let { x1: t, y1: s, x2: i, y2: r } = e.data;
  return e.editHistory.forEach(({ data: o }) => {
    const n = o.x2 - o.x1, c = o.y2 - o.y1;
    o.type === ue.Move ? (t += n, s += c, i += n, r += c) : o.type === ue.MoveStart ? (t += n, s += c) : o.type === ue.MoveEnd && (i += n, r += c);
  }), {
    ...e.data,
    x1: t,
    x2: i,
    y1: s,
    y2: r
  };
}
function st(e, t) {
  const { size: s, color: i, x1: r, x2: o, y1: n, y2: c } = ze(t);
  e.lineCap = "round", e.lineJoin = "bevel", e.lineWidth = s, e.strokeStyle = i;
  const f = o - r, h = c - n, a = s * 3, l = Math.atan2(h, f);
  e.beginPath(), e.moveTo(r, n), e.lineTo(o, c), e.lineTo(o - a * Math.cos(l - Math.PI / 6), c - a * Math.sin(l - Math.PI / 6)), e.moveTo(o, c), e.lineTo(o - a * Math.cos(l + Math.PI / 6), c - a * Math.sin(l + Math.PI / 6)), e.stroke(), t.isSelected && (X(e, r, n), X(e, o, c));
}
var ue = /* @__PURE__ */ ((e) => (e[e.Move = 0] = "Move", e[e.MoveStart = 1] = "MoveStart", e[e.MoveEnd = 2] = "MoveEnd", e))(ue || {});
function ct() {
  const e = O(), [, t] = j(), [s, i] = J(), [r, o] = H(), n = U(), [c, f] = $(3), [h, a] = $("#ee5126"), l = E(null), u = E(null), d = s === "Arrow", p = g(() => {
    i.set("Arrow"), t.set("default");
  }, [i, t]), w = g(() => {
    d || (p(), o.clearSelect());
  }, [d, p, o]), S = g(
    (v, m) => {
      if (v.name !== "Arrow" || !n.current)
        return;
      const x = v;
      p();
      const { x1: C, y1: z, x2: B, y2: D } = ze(x);
      let k = 0;
      N(n.current.canvas, m, {
        x: C,
        y: z
      }) ? k = 1 : N(n.current.canvas, m, {
        x: B,
        y: D
      }) && (k = 2), u.current = {
        type: _.Edit,
        data: {
          type: k,
          x1: m.clientX,
          y1: m.clientY,
          x2: m.clientX,
          y2: m.clientY
        },
        source: x
      }, o.select(v);
    },
    [n, p, o]
  ), R = g(
    (v) => {
      if (!d || l.current || !n.current)
        return;
      const { left: m, top: x } = n.current.canvas.getBoundingClientRect();
      l.current = {
        name: "Arrow",
        type: _.Source,
        data: {
          size: c,
          color: h,
          x1: v.clientX - m,
          y1: v.clientY - x,
          x2: v.clientX - m,
          y2: v.clientY - x
        },
        editHistory: [],
        draw: st,
        isHit: he
      };
    },
    [d, h, c, n]
  ), b = g(
    (v) => {
      if (!(!d || !n.current)) {
        if (u.current)
          u.current.data.x2 = v.clientX, u.current.data.y2 = v.clientY, r.top !== u.current ? (u.current.source.editHistory.push(u.current), o.push(u.current)) : o.set(r);
        else if (l.current) {
          const { left: m, top: x } = n.current.canvas.getBoundingClientRect();
          l.current.data.x2 = v.clientX - m, l.current.data.y2 = v.clientY - x, r.top !== l.current ? o.push(l.current) : o.set(r);
        }
      }
    },
    [d, r, n, o]
  ), M = g(() => {
    d && (l.current && o.clearSelect(), l.current = null, u.current = null);
  }, [d, o]);
  return ie(S), ee(R), te(b), ne(M), /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_arrow_title,
      icon: "icon-arrow",
      checked: d,
      onClick: w,
      option: /* @__PURE__ */ y.createElement(ce, { size: c, color: h, onSizeChange: f, onColorChange: a })
    }
  );
}
function be(e) {
  let { x1: t, y1: s, x2: i, y2: r } = e.data;
  return e.editHistory.forEach(({ data: o }) => {
    const n = o.x2 - o.x1, c = o.y2 - o.y1;
    o.type === I.Move ? (t += n, s += c, i += n, r += c) : o.type === I.ResizeTop ? s += c : o.type === I.ResizeRightTop ? (i += n, s += c) : o.type === I.ResizeRight ? i += n : o.type === I.ResizeRightBottom ? (i += n, r += c) : o.type === I.ResizeBottom ? r += c : o.type === I.ResizeLeftBottom ? (t += n, r += c) : o.type === I.ResizeLeft ? t += n : o.type === I.ResizeLeftTop && (t += n, s += c);
  }), {
    ...e.data,
    x1: t,
    x2: i,
    y1: s,
    y2: r
  };
}
function it(e, t) {
  const { size: s, color: i, x1: r, y1: o, x2: n, y2: c } = be(t);
  e.lineCap = "butt", e.lineJoin = "miter", e.lineWidth = s, e.strokeStyle = i;
  const f = (r + n) / 2, h = (o + c) / 2, a = Math.abs(n - r) / 2, l = Math.abs(c - o) / 2, u = 0.5522848, d = a * u, p = l * u;
  e.beginPath(), e.moveTo(f - a, h), e.bezierCurveTo(f - a, h - p, f - d, h - l, f, h - l), e.bezierCurveTo(f + d, h - l, f + a, h - p, f + a, h), e.bezierCurveTo(f + a, h + p, f + d, h + l, f, h + l), e.bezierCurveTo(f - d, h + l, f - a, h + p, f - a, h), e.closePath(), e.stroke(), t.isSelected && (e.lineWidth = 1, e.strokeStyle = "#000000", e.fillStyle = "#ffffff", e.beginPath(), e.moveTo(r, o), e.lineTo(n, o), e.lineTo(n, c), e.lineTo(r, c), e.closePath(), e.stroke(), X(e, (r + n) / 2, o), X(e, n, o), X(e, n, (o + c) / 2), X(e, n, c), X(e, (r + n) / 2, c), X(e, r, c), X(e, r, (o + c) / 2), X(e, r, o));
}
var I = /* @__PURE__ */ ((e) => (e[e.Move = 0] = "Move", e[e.ResizeTop = 1] = "ResizeTop", e[e.ResizeRightTop = 2] = "ResizeRightTop", e[e.ResizeRight = 3] = "ResizeRight", e[e.ResizeRightBottom = 4] = "ResizeRightBottom", e[e.ResizeBottom = 5] = "ResizeBottom", e[e.ResizeLeftBottom = 6] = "ResizeLeftBottom", e[e.ResizeLeft = 7] = "ResizeLeft", e[e.ResizeLeftTop = 8] = "ResizeLeftTop", e))(I || {});
function at() {
  const e = O(), [t, s] = H(), [i, r] = J(), [, o] = j(), n = U(), [c, f] = $(3), [h, a] = $("#ee5126"), l = E(null), u = E(null), d = i === "Ellipse", p = g(() => {
    r.set("Ellipse"), o.set("crosshair");
  }, [r, o]), w = g(() => {
    d || (p(), s.clearSelect());
  }, [d, p, s]), S = g(
    (v, m) => {
      if (v.name !== "Ellipse" || !n.current)
        return;
      const x = v;
      p();
      const { x1: C, y1: z, x2: B, y2: D } = be(x);
      let k = 0;
      N(n.current.canvas, m, {
        x: (C + B) / 2,
        y: z
      }) ? k = 1 : N(n.current.canvas, m, {
        x: B,
        y: z
      }) ? k = 2 : N(n.current.canvas, m, {
        x: B,
        y: (z + D) / 2
      }) ? k = 3 : N(n.current.canvas, m, {
        x: B,
        y: D
      }) ? k = 4 : N(n.current.canvas, m, {
        x: (C + B) / 2,
        y: D
      }) ? k = 5 : N(n.current.canvas, m, {
        x: C,
        y: D
      }) ? k = 6 : N(n.current.canvas, m, {
        x: C,
        y: (z + D) / 2
      }) ? k = 7 : N(n.current.canvas, m, {
        x: C,
        y: z
      }) && (k = 8), u.current = {
        type: _.Edit,
        data: {
          type: k,
          x1: m.clientX,
          y1: m.clientY,
          x2: m.clientX,
          y2: m.clientY
        },
        source: x
      }, s.select(v);
    },
    [n, p, s]
  ), R = g(
    (v) => {
      if (!d || !n.current || l.current)
        return;
      const { left: m, top: x } = n.current.canvas.getBoundingClientRect(), C = v.clientX - m, z = v.clientY - x;
      l.current = {
        name: "Ellipse",
        type: _.Source,
        data: {
          size: c,
          color: h,
          x1: C,
          y1: z,
          x2: C,
          y2: z
        },
        editHistory: [],
        draw: it,
        isHit: he
      };
    },
    [d, c, h, n]
  ), b = g(
    (v) => {
      if (!(!d || !n.current)) {
        if (u.current)
          u.current.data.x2 = v.clientX, u.current.data.y2 = v.clientY, t.top !== u.current ? (u.current.source.editHistory.push(u.current), s.push(u.current)) : s.set(t);
        else if (l.current) {
          const { left: m, top: x } = n.current.canvas.getBoundingClientRect();
          l.current.data.x2 = v.clientX - m, l.current.data.y2 = v.clientY - x, t.top !== l.current ? s.push(l.current) : s.set(t);
        }
      }
    },
    [d, n, t, s]
  ), M = g(() => {
    d && (l.current && s.clearSelect(), l.current = null, u.current = null);
  }, [d, s]);
  return ie(S), ee(R), te(b), ne(M), /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_ellipse_title,
      icon: "icon-ellipse",
      checked: d,
      onClick: w,
      option: /* @__PURE__ */ y.createElement(ce, { size: c, color: h, onSizeChange: f, onColorChange: a })
    }
  );
}
function ke(e) {
  let { x1: t, y1: s, x2: i, y2: r } = e.data;
  return e.editHistory.forEach(({ data: o }) => {
    const n = o.x2 - o.x1, c = o.y2 - o.y1;
    o.type === W.Move ? (t += n, s += c, i += n, r += c) : o.type === W.ResizeTop ? s += c : o.type === W.ResizeRightTop ? (i += n, s += c) : o.type === W.ResizeRight ? i += n : o.type === W.ResizeRightBottom ? (i += n, r += c) : o.type === W.ResizeBottom ? r += c : o.type === W.ResizeLeftBottom ? (t += n, r += c) : o.type === W.ResizeLeft ? t += n : o.type === W.ResizeLeftTop && (t += n, s += c);
  }), {
    ...e.data,
    x1: t,
    x2: i,
    y1: s,
    y2: r
  };
}
function lt(e, t) {
  const { size: s, color: i, x1: r, y1: o, x2: n, y2: c } = ke(t);
  e.lineCap = "butt", e.lineJoin = "miter", e.lineWidth = s, e.strokeStyle = i, e.beginPath(), e.moveTo(r, o), e.lineTo(n, o), e.lineTo(n, c), e.lineTo(r, c), e.closePath(), e.stroke(), t.isSelected && (e.lineWidth = 1, e.strokeStyle = "#000000", e.fillStyle = "#ffffff", X(e, (r + n) / 2, o), X(e, n, o), X(e, n, (o + c) / 2), X(e, n, c), X(e, (r + n) / 2, c), X(e, r, c), X(e, r, (o + c) / 2), X(e, r, o));
}
var W = /* @__PURE__ */ ((e) => (e[e.Move = 0] = "Move", e[e.ResizeTop = 1] = "ResizeTop", e[e.ResizeRightTop = 2] = "ResizeRightTop", e[e.ResizeRight = 3] = "ResizeRight", e[e.ResizeRightBottom = 4] = "ResizeRightBottom", e[e.ResizeBottom = 5] = "ResizeBottom", e[e.ResizeLeftBottom = 6] = "ResizeLeftBottom", e[e.ResizeLeft = 7] = "ResizeLeft", e[e.ResizeLeftTop = 8] = "ResizeLeftTop", e))(W || {});
function ut() {
  const e = O(), [t, s] = H(), [i, r] = J(), [, o] = j(), n = U(), [c, f] = $(3), [h, a] = $("#ee5126"), l = E(null), u = E(null), d = i === "Rectangle", p = g(() => {
    r.set("Rectangle"), o.set("crosshair");
  }, [r, o]), w = g(() => {
    d || (p(), s.clearSelect());
  }, [d, p, s]), S = g(
    (v, m) => {
      if (v.name !== "Rectangle" || !n.current)
        return;
      const x = v;
      p();
      const { x1: C, y1: z, x2: B, y2: D } = ke(x);
      let k = 0;
      N(n.current.canvas, m, {
        x: (C + B) / 2,
        y: z
      }) ? k = 1 : N(n.current.canvas, m, {
        x: B,
        y: z
      }) ? k = 2 : N(n.current.canvas, m, {
        x: B,
        y: (z + D) / 2
      }) ? k = 3 : N(n.current.canvas, m, {
        x: B,
        y: D
      }) ? k = 4 : N(n.current.canvas, m, {
        x: (C + B) / 2,
        y: D
      }) ? k = 5 : N(n.current.canvas, m, {
        x: C,
        y: D
      }) ? k = 6 : N(n.current.canvas, m, {
        x: C,
        y: (z + D) / 2
      }) ? k = 7 : N(n.current.canvas, m, {
        x: C,
        y: z
      }) && (k = 8), u.current = {
        type: _.Edit,
        data: {
          type: k,
          x1: m.clientX,
          y1: m.clientY,
          x2: m.clientX,
          y2: m.clientY
        },
        source: v
      }, s.select(v);
    },
    [n, p, s]
  ), R = g(
    (v) => {
      if (!d || !n.current || l.current)
        return;
      const { left: m, top: x } = n.current.canvas.getBoundingClientRect(), C = v.clientX - m, z = v.clientY - x;
      l.current = {
        name: "Rectangle",
        type: _.Source,
        data: {
          size: c,
          color: h,
          x1: C,
          y1: z,
          x2: C,
          y2: z
        },
        editHistory: [],
        draw: lt,
        isHit: he
      };
    },
    [d, c, h, n]
  ), b = g(
    (v) => {
      if (!(!d || !n.current)) {
        if (u.current)
          u.current.data.x2 = v.clientX, u.current.data.y2 = v.clientY, t.top !== u.current ? (u.current.source.editHistory.push(u.current), s.push(u.current)) : s.set(t);
        else if (l.current) {
          const { left: m, top: x } = n.current.canvas.getBoundingClientRect(), C = l.current.data;
          C.x2 = v.clientX - m, C.y2 = v.clientY - x, t.top !== l.current ? s.push(l.current) : s.set(t);
        }
      }
    },
    [d, n, t, s]
  ), M = g(() => {
    d && (l.current && s.clearSelect(), l.current = null, u.current = null);
  }, [d, s]);
  return ie(S), ee(R), te(b), ne(M), /* @__PURE__ */ y.createElement(
    A,
    {
      title: e.operation_rectangle_title,
      icon: "icon-rectangle",
      checked: d,
      onClick: w,
      option: /* @__PURE__ */ y.createElement(ce, { size: c, color: h, onSizeChange: f, onColorChange: a })
    }
  );
}
const ft = [ut, at, ct, ot, nt, Je, "|", Ve, Oe, "|", Fe, We, Ie];
const Ee = y.createContext(null), ht = F(function() {
  const { width: t, height: s } = Y(), [i] = K(), [r, o] = $(null), [n, c] = $(null), f = E(null), h = g((l) => {
    l.stopPropagation();
  }, []), a = g((l) => {
    l.preventDefault(), l.stopPropagation();
  }, []);
  return T(() => {
    if (!i || !f.current)
      return;
    const l = f.current.getBoundingClientRect();
    let u = i.x + i.width - l.width, d = i.y + i.height + 10;
    u < 0 && (u = 0), u > t - l.width && (u = t - l.width), d > s - l.height && (d = s - l.height - 10), (!n || Math.abs(n.x - u) > 1 || Math.abs(n.y - d) > 1) && c({
      x: u,
      y: d
    }), (!r || Math.abs(r.x - l.x) > 1 || Math.abs(r.y - l.y) > 1 || Math.abs(r.width - l.width) > 1 || Math.abs(r.height - l.height) > 1) && o({
      x: l.x,
      y: l.y,
      width: l.width,
      height: l.height
    });
  }), i ? /* @__PURE__ */ y.createElement(Ee.Provider, { value: r }, /* @__PURE__ */ y.createElement(
    "div",
    {
      ref: f,
      className: "screenshots-operations",
      style: {
        visibility: n ? "visible" : "hidden",
        transform: `translate(${(n == null ? void 0 : n.x) ?? 0}px, ${(n == null ? void 0 : n.y) ?? 0}px)`
      },
      onDoubleClick: h,
      onContextMenu: a
    },
    /* @__PURE__ */ y.createElement("div", { className: "screenshots-operations-buttons" }, ft.map((l, u) => l === "|" ? /* @__PURE__ */ y.createElement("div", { key: u, className: "screenshots-operations-divider" }) : /* @__PURE__ */ y.createElement(l, { key: u })))
  )) : null;
});
function dt(e) {
  const [t, s] = $(null);
  return T(() => {
    if (s(null), e == null)
      return;
    const i = document.createElement("img"), r = () => s(i), o = () => s(null);
    return i.addEventListener("load", r), i.addEventListener("error", o), i.src = e, () => {
      i.removeEventListener("load", r), i.removeEventListener("error", o);
    };
  }, [e]), t;
}
function pt({ url: e, width: t, height: s, lang: i, className: r, ...o }) {
  const n = dt(e), c = E(null), f = E({}), [h, a] = $({
    index: -1,
    stack: []
  }), [l, u] = $(null), [d, p] = $("move"), [w, S] = $(void 0), R = {
    url: e,
    width: t,
    height: s,
    image: n,
    lang: {
      ...Re,
      ...i
    },
    emiterRef: f,
    canvasContextRef: c,
    history: h,
    bounds: l,
    cursor: d,
    operation: w
  }, b = g(
    (z, ...B) => {
      const D = o[z];
      typeof D == "function" && D(...B);
    },
    [o]
  ), M = {
    call: b,
    setHistory: a,
    setBounds: u,
    setCursor: p,
    setOperation: S
  }, v = ["screenshots"];
  r && v.push(r);
  const m = () => {
    f.current = {}, a({
      index: -1,
      stack: []
    }), u(null), p("move"), S(void 0);
  }, x = g(
    async (z) => {
      if (!(z.button !== 0 || !n))
        if (l && c.current)
          fe({
            image: n,
            width: t,
            height: s,
            history: h,
            bounds: l
          }).then((B) => {
            b("onOk", B, l), m();
          });
        else {
          const B = {
            x: 0,
            y: 0,
            width: t,
            height: s
          };
          fe({
            image: n,
            width: t,
            height: s,
            history: h,
            bounds: B
          }).then((D) => {
            b("onOk", D, B), m();
          });
        }
    },
    [n, h, l, t, s, b]
  ), C = g(
    (z) => {
      z.button === 2 && (z.preventDefault(), b("onCancel"), m());
    },
    [b]
  );
  return Q(() => {
    m();
  }, [e]), /* @__PURE__ */ y.createElement(ye.Provider, { value: { store: R, dispatcher: M } }, /* @__PURE__ */ y.createElement(
    "div",
    {
      className: v.join(" "),
      style: { width: t, height: s },
      onDoubleClick: x,
      onContextMenu: C
    },
    /* @__PURE__ */ y.createElement(Pe, null),
    /* @__PURE__ */ y.createElement(He, { ref: c }),
    /* @__PURE__ */ y.createElement(ht, null)
  ));
}
export {
  pt as default
};
