# LG ThinQ Local for Home Assistant

Репозиторий приложения Home Assistant OS, которое запускает
[Rethink](https://github.com/anszom/rethink) для полностью локального управления
совместимыми устройствами LG ThinQ.

## Возможности

- управление и получение состояния без облака LG;
- MQTT Discovery для Home Assistant;
- безопасный интерфейс через Home Assistant Ingress;
- постоянное хранение локального CA и состояний устройств;
- обслуживание нескольких устройств одним экземпляром;
- фиксированный digest базового образа Rethink.

## Быстрая установка

Добавьте URL как пользовательский репозиторий в магазине приложений Home
Assistant:

```text
https://github.com/akinin/rethink-home-assistant-app
```

Затем установите **LG ThinQ Local**, укажите MQTT-подключение и создайте DNS:

```text
rethink.lan  A  <IP Home Assistant>  TTL 300
```

Подробное руководство находится в
[`rethink/DOCS.md`](rethink/DOCS.md). Там описаны первичная регистрация,
подключение второго кондиционера, временная запись `common.lgthinq.com`, смысл
TTL, резервное копирование, обновление и откат.

## Android-компаньон

В каталоге [`apk/`](apk/) сохранена проверенная неизменённая официальная сборка
[Rethink Setup for Android v1.1.1](https://github.com/anszom/rethink-setup-android/releases/tag/v1.1.1).
Она проверяет DNS-перенаправление и выполняет первичную регистрацию устройства
без ноутбука. В каталоге указаны SHA-256, источник, требования и пошаговая
инструкция.

## Структура

```text
rethink/
├── config.yaml       # манифест и параметры Home Assistant App
├── Dockerfile        # закреплённый образ Rethink
├── run.sh            # безопасная генерация конфигурации и запуск
├── README.md         # карточка в магазине приложений
├── DOCS.md           # полное руководство
├── CHANGELOG.md
└── translations/     # русский и английский интерфейс параметров
apk/
├── rethink-setup-android-v1.1.1.apk
├── SHA256SUMS
└── README.md          # установка, проверка и DNS/TTL
```

## Безопасность

- management-интерфейс доступен только через Ingress;
- пароль MQTT не входит в репозиторий;
- порты ThinQ1 и внутренний MQTT ограничены loopback-интерфейсом;
- снаружи приложению нужны только `443/tcp` и `8883/tcp` из локального/IoT
  сегмента.

Перед публикацией проблем удаляйте из журналов IP-адреса, UUID устройств,
пароли MQTT и содержимое `/data`.

## Происхождение и лицензия

Серверная часть предоставляется проектом
[anszom/rethink](https://github.com/anszom/rethink) под GPL-2.0. Этот репозиторий
содержит упаковку и документацию Home Assistant и не связан с LG Electronics.
