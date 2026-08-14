# Rethink Setup for Android

**Русский** · [English](README.en.md)

В этом каталоге сохранена неизменённая официальная сборка Android-компаньона
для первичного подключения устройств к Rethink:

- файл: [`rethink-setup-android-v1.1.1.apk`](rethink-setup-android-v1.1.1.apk);
- версия: `v1.1.1`;
- размер релиза: `13 844 948` байт;
- опубликован upstream: 1 августа 2026 года;
- исходный релиз:
  [anszom/rethink-setup-android v1.1.1](https://github.com/anszom/rethink-setup-android/releases/tag/v1.1.1);
- исходный код:
  [anszom/rethink-setup-android](https://github.com/anszom/rethink-setup-android);
- лицензия upstream: MIT;
- SHA-256:
  `6c1e13605e0842b9c2a796102cc04b615db4a80a9901cbf4be1f10c93183098a`.

## Проверка файла

macOS:

```bash
shasum -a 256 rethink-setup-android-v1.1.1.apk
```

Linux:

```bash
sha256sum rethink-setup-android-v1.1.1.apk
```

PowerShell:

```powershell
Get-FileHash .\rethink-setup-android-v1.1.1.apk -Algorithm SHA256
```

Результат должен точно совпасть с хэшем выше и с digest официального GitHub
Release. Если не совпадает — не устанавливайте файл.

## Установка

1. Скачайте APK на телефон или планшет с Android 8.0 или новее.
2. Разрешите установку неизвестных приложений только для файлового менеджера или
   браузера, которым открываете APK.
3. Установите APK.
4. После установки верните запрет на установку неизвестных приложений.
5. Подключите устройство Android к домашнему Wi-Fi и выполните **Check DNS
   redirection**.
6. Для нового кондиционера откройте **Provision a device** и следуйте мастеру.

Приложение не заменяет сервер **LG ThinQ Local**. Оно нужно только для проверки
DNS и передачи параметров домашнего Wi-Fi устройству LG при первичной
регистрации.

## DNS и TTL для мастера

Перед **Check DNS redirection** должны существовать:

```text
rethink.lan         A  <IP Home Assistant>  TTL 300  # постоянно
common.lgthinq.com  A  <IP Home Assistant>  TTL 300  # временно
```

`TTL 300` равен пяти минутам. После создания записи подождите до пяти минут или
переподключите Wi-Fi планшета. В приложении успешная проверка ThinQ2 должна
подтвердить, что облако LG обслуживается локальным Rethink.

После успешного подключения кондиционера удалите локальную запись
`common.lgthinq.com`. Запись `rethink.lan` оставьте: по ней техника будет
находить локальный сервер после перезапуска или потери Wi-Fi.

## Обновление APK

Новая версия добавляется только после проверки официального GitHub Release и
его SHA-256. Старый APK не заменяется файлом с тем же именем: версия всегда
указывается в имени, чтобы контрольные суммы оставались однозначными.
