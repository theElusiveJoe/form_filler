# Form_filler
программа для перегонки данных из интернет-магазинов в сервисы доставки
# Установка

```
git clone https://github.com/theElusiveJoe/form_filler.git
```
переходим в скачанную директорию
```
pip install -r requirements.txt
```

## установка под Windows 
1) скачиваем и устанавливаем инструментарий git

    https://git-scm.com/download/win
2) скачиваем и устанавливаем python

   https://www.python.org/downloads/

3) далее работаем из коммандной строки (приложение cmd)
   

    ```
    cd /d %userprofile%/desktop
    ```
    ```
    git clone https://github.com/theElusiveJoe/form_filler.git
    ```
    ```
    cd form_filler
    ```
    ```
    pip install -r requirements.txt
    ```
4) не забываем добавлять файлы аутентификации:
    + ./tokens.json
    + ./form-filler-329419-cdcaa2a0d92a.json
    + ./compose_data/client_secret_631167030062-r92ma42enmb8vg3evkdo0ltvit1ecf1h.apps.googleusercontent.com.json
    + ./warehouse/tokens.json
    + ./warehouse/form-filler-329419-cdcaa2a0d92a.json
    + ./compose_data/client_secret_631167030062-r92ma42enmb8vg3evkdo0ltvit1ecf1h.apps.googleusercontent.com.json


5) создаем ярлык для файла mainserver.py в папке form_filler (которая лежит на рабочем столе)

# Запуск

из корневой директории
```
python3 mainserver.py
```