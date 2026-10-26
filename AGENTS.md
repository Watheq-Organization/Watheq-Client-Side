# 🚨 Mandatory Agent Directives (قواعد وتوجيهات الوكيل الملزمة)

> **CRITICAL & BINDING (إلزامي وتلقائي):**
> Before executing ANY task or modifying any file in this project, you MUST read, adhere to, and strictly follow the instructions in:
> 📄 [AGENT.md](file:///d:/MAHMOUD2026/WatheqNew/WatiqNew_/AGENT.md)

---

## ⚡ ملخص القواعد الفورية (Quick Rules Enforcement)

1. **الرجوع الدائم إلى [AGENT.md](file:///d:/MAHMOUD2026/WatheqNew/WatiqNew_/AGENT.md):**
   - قراءة وتطبيق تعليمات [AGENT.md](file:///d:/MAHMOUD2026/WatheqNew/WatiqNew_/AGENT.md) قبل تنفيذ أي مهمة أو تعديل. قراءة الملف لمرة واحدة في بداية الجلسة لا تكفي.

2. **فحص الكود والالتزام بالنطاق (Scope & Existing Code):**
   - افحص الملفات المستهدفة والكود المرتبط بها قبل البدء في التعديل.
   - لا تعدل أي ملف أو وظيفة غير مطلوبة في المهمة (Scope Discipline).
   - تجنب تكرار المكونات أو الدوال إن كانت موجودة مسبقاً (DRY).

3. **الالتزام بالمعمارية والـ APIs:**
   - مرجع الـ APIs الرسمي هو `swagger.json` في جذر المشروع؛ لا تفترض أي endpoint أو حقل غير موثق.
   - يُمنع منعاً باتاً استدعاء `fetch` أو الـ API داخل مكونات الواجهة (JSX/Page Components). جميع الطلبات تمر حصراً عبر `src/services/` باستخدام `httpClient`.

4. **معالجة الحالات الحدية (Edge Cases):**
   - وفر دائماً معالجة لحالات التحميل (`loading`)، والبيانات الفارغة (`empty`)، والأخطاء (`error`).
   - احرص على عدم كسر أي ميزة قائمة في التطبيق.

5. **الفحص والتأكيد:**
   - تحقق دائماً من سلامة الأنواع عبر `npx tsc --noEmit` بعد كل تعديل.
   - قدّم تقريراً ختامياً يوضح ما تم تنفيذه والملفات المعدلة ونتائج الفحص.

👉 **للاطلاع على الدليل الكامل والمعمارية المفصلة:** اقرأ [AGENT.md](file:///d:/MAHMOUD2026/WatheqNew/WatiqNew_/AGENT.md).
