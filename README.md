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
4) копируем файлы с токенами, не забываем включить боевой режим 
5) создаем ярлык для файла mainserver.py в папке form_filler (которая лежит на рабочем столе)

# Запуск

из корневой директории
```
python3 mainserver.py
```