# الدارجة المغربية في كتابة الكابشن

## الوضع الحالي (مهم أن تعرفه)
Whisper من OpenAI **لا يملك لغة اسمها الدارجة**؛ يكتبها بوصفها «عربية» فتأتي أحياناً مصحّحة إلى الفصحى أو بأخطاء. لذلك في التطبيق:
- اختيار **«الدارجة المغربية»** يشغّل النموذج على اللغة العربية، ثم يطبّق **توحيد تهجئة الدارجة** (دبا ← دابا، بزااااف ← بزاف…) و**قاموس التصحيح** الخاص بك.
- اختر الجودة **«دقيق»** (Whisper small) على الأقل؛ النماذج الصغيرة جداً ضعيفة مع اللهجات.
- راجع النص دائماً وعدّله من قسم «النص والتوقيت».

## نماذج مدرَّبة على الدارجة
توجد نماذج Whisper مضبوطة على الدارجة على Hugging Face (مثل `ychafiqui/whisper-small-darija` و`ychafiqui/whisper-medium-darija` — رخصة Apache-2.0 للمتوسط؛ **تحقق من رخصة كل نموذج قبل استخدامه تجارياً**). لكنها بصيغة PyTorch/safetensors، **والتطبيق يحتاج صيغة ONNX**، ولم أجد نسخة ONNX جاهزة منها وقت الإعداد.

### تحويل نموذج بنفسك (لم أجرّب هذه الخطوات هنا)
```bash
git clone https://github.com/huggingface/transformers.js && cd transformers.js
pip install -r scripts/requirements.txt
python -m scripts.convert --quantize --model_id ychafiqui/whisper-small-darija
```
(راجع توثيق transformers.js الحالي لخيارات التحويل.) ثم ارفع مجلد النتيجة (فيه `onnx/` و`config.json` و`tokenizer.json`…) إلى مستودع على Hugging Face، مثلاً `youruser/whisper-small-darija-onnx`.

### استخدامه في التطبيق
الكابشن ← الجودة: **نموذج مخصص (ONNX)** ← اكتب `youruser/whisper-small-darija-onnx`.
- التحويل العادي لا يصدّر ما يلزم لتوقيت **كل كلمة**، فيعمل التطبيق بتوقيت **الجملة** (يوزّعه على الكلمات تقريبياً)، وتبقى ميزة تلوين الكلمة تقريبية.
- التحميل يتم من Hugging Face في أول مرة ثم يُحفظ في المتصفح.
