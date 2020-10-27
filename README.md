Клиент (honeyOS сборка) находится здесь: <a  target="_blank" href='https://mega.nz/file/3OQlACpY#hYjRKTNcSZXa53PFv6VtB5DVazxcA6CGn2LjIXSlQeY'>mega.nz</a>

<h2>Возможности</h2><p>
- Настройка майнера<p>
- Разгон карт<p>
- Контроль хешрейта<p>
- Просмотр логов<p>
- Удаленные команды<p>
- Удаленная консоль<p>
- Показатели работы<p>
- Уведомления Telegram<p>

<h4>Обзор системы, настройка клиента, инструкции по использованию</h4>

[![Посмотреть в youtube](http://img.youtube.com/vi/QAO7KSql2rM/0.jpg)](http://www.youtube.com/watch?v=QAO7KSql2rM "Посмотреть в youtube")
 
<br/>
<h3>Логины / пароли по умолчанию</h3>

Сервер:<br/>
Логин - crypto@honey<br/>
Пароль - MiningLive

Клиент:<br/>
Логин - work<br/>
Пароль - 1

<br/>
<h2>Установка сервера ~ 15 минут</h2>

Протестированно на ubuntu server 18

<i>Действия перед настройкой:</i>
  - Арендуйте vps сервер, большой выбор <a  target="_blank" href='https://poiskvps.ru/index.php?search_hdd_min=10&search_ram_min=1500&search_os%5B%5D=3'>здесь</a><br/>
  Минимальные требования:<br/>
  -- HDD от 10 Gb<br/>
  -- RAM от 1 Gb<br/>
  -- Не в России (если будете подключать телеграм) или придется искать еще прокси
  - скачайте PuTTY (для соединения с серевом по ssh) <a target="_blank" href="https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html"> greenend.org.uk</a> или <a target="_blank" href="https://portableapps.com/apps/internet/putty_portable">portableapps.com (portable)</a> 
  
<br/>                       
                                                                                                                                              
После получения ip и логина/пароля root пользователя на ваш сервер, подключаетесь через PuTTY и далее:


<br/> 

<i>Переключаемся на супер пользователя</i>

<code>sudo su</code>

<i>Установка основных репозиториев ubuntu</i>

<code>sudo add-apt-repository main<br/>
sudo add-apt-repository universe<br/>
sudo add-apt-repository restrict<br/>
sudo add-apt-repository multiverse</code>

<i>Установка необходимых пакетов</i>

<code>apt-get -y install git nodejs npm screen</code>

<p>

<i>Копирование последней версии сервера</i>

<code>cd /</code>

<code>git clone https://github.com/honey-system/honeyserver.git</code>


<i>Запуск установки</i>

<code>/honeyserver/server.sh setup</code>

<br/><br/>

<h4>Настройка сервера</h4>

Перед запуском, необходимо произвести настройку:

Можно сконфигурировать имя пользователя (не обязательно), которое будет создаваться при инициализации сервера:

Редактирование файла:

<code>nano /honeyserver/server/entity/account.json</code>

изменить строчки

<code>"email": "<b>ваш email, важно наличие @ в строке</b>",</code>

<code>"password": "<b>ваш пароль</b>",</code>

сохранить файл и выйти из редактора:

ctrl + o  =>  enter  => ctrl + z

<br/>

Если у вас уже была база данных, рекомендуется её удалить или переместить:

<i>Удаление </i>

<code>rm /honeyserver/storage/database.db</code>

<i>Перемещение </i>

<code>mv /honeyserver/storage/database.db /honeyserver/storage/database.db.bkp</code>


<i>Запуск создания данных (<b>Обязательно при первом запуске</b>) </i>

<code>/honeyserver/server.sh init</code>

<br/>

Если в папке /honeyserver/server/ нет файла <b>config.json</b> - скопируйте его из образца  коммандой:

<code>cp /honeyserver/server/config.json.tmpl /honeyserver/server/config.json</code>

<br/>

Если будете использовать телеграмм бота, необходимо его создать и ввести полученный ключ в файл
<b>config.json</b> :

Редактирование файла:

<code>nano /honeyserver/server/config.json</code>

изменить строчку 

<code>"telegramToken": "<b>ваш ключ</b>",</code>

сохранить файл и выйти из редактора:

ctrl + o  =>  enter  => ctrl + z

<br/>


<br/>
<b>Все, настройка закончена!</b>
<br/>
<br/>

<b>Если вы раньше вводили "sudo su" - теперь необходимо выйти из этого режима, выполнив команду "exit"</b>

<i>Теперь можно запустить сервер </i>

<code>/honeyserver/server.sh start</code>



<br/><br/>

<h4>Команды сервера</h4>

<i>Запуск </i>

<code>/honeyserver/server.sh start</code>

<i>Остановка </i>

<code>/honeyserver/server.sh stop</code>

<i>Перезапуск </i>

<code>/honeyserver/server.sh restart</code>

<i>Мониторинг </i>

<code>/honeyserver/server.sh monitor</code>

или 

<code>/honeyserver/server.sh m</code>

<i><b>Важно</b>: Как выйти из мониторинга:</i>

<b>CTRL + A => CTRL + D</b>

<i>Просмотр логов </i>

<code>/honeyserver/server.sh log</code>

<i>Обновление на новую версию  сервера

<code>/honeyserver/server.sh update</code>


<br/>
<h2>Быстрая настройка клиента (сборки)</h2>
<br/>

1. Скачать:
    - HoneyOS <a target="_blank" href='https://mega.nz/file/3OQlACpY#hYjRKTNcSZXa53PFv6VtB5DVazxcA6CGn2LjIXSlQeY'>mega.nz</a>
    - HDD Raw Copy Tool portable <a target="_blank" href="http://hddguru.com/software/HDD-Raw-Copy-Tool/HDDRawCopy1.10Portable.exe" >hddguru.com</a>
    - HDD LLF Low Level Format Tool portable <a target="_blank" href="http://hddguru.com/software/HDD-LLF-Low-Level-Format-Tool/HDDLLF.4.40.exe">hddguru.com</a>
    - 7-zip архиватор (если нет, чем открыть rar) <a target="_blank" href="https://www.7-zip.org/a/7z1805.exe">7-zip.org</a>
    - PuTTY (для соединения с ригом по ssh) <a target="_blank" href="https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html"> greenend.org.uk</a> 
    <a target="_blank" href="https://portableapps.com/apps/internet/putty_portable">portableapps.com (portable)</a> 
    
2. Создать риги, присвоить им майнеры
    - Записать образ на диск или флешку:
    - Распаковать HoneyOS образ
    - Подключить флешку, или если это HDD - через переходник или напрямую к sata
    - В HDD Raw Copy Tool portable на первом шаге - выбрать образ, далее
    - Выбрать целевой диск - будте внимательны!
    - Start
    - По окончании - зайдите на диск "HONEY_CONF" и в файле "rig.conf" введите id рига и его пароль (или вы можете это сделать при запуске системы)
    - В файле "server.conf" введите IP адресс вашего VPS сервера и порт 3000, например: <br/>
    HONEY_SERVER="http://1.2.3.4:3000/"<br/>
    не забудьте / в конце адресса
    - Готово, флешку можно подключать к ригу

Если запись образа прерывается, воспользуйтесь "HDD LLF Low Level Format Tool" что бы стереть диск полностью, затем повторите



<br/><br/>

<h4>Команды клиента (сборки)</h4>

<i>Запуск майнера</i>

<code>miner start</code>

<i>Остановка майнера</i>

<code>miner stop</code>

<i>Перезапуск майнера</i>

<code>miner restart</code>

<i>Монитор показателей рига</i>

<code>honey m</code>

<i><b>Важно</b>: Как выйти из мониторинга (только так!):</i>

<b><code>honey sm</code></b>


<i>Лог последний</i>

<code>log</code>

<i>Лог предпоследний</i>

<code>log last</code>

<i>100% перезагрузка рига (бывает карты не дают это сделать)</i>

<code>honey hr</code>

<i>Получить конфигурацию с сервера (очень редко нужно)</i>

<code>honey updateconf</code>

<i>Обновить клиент на последнюю версию</i>

<code>honey upgrade</code>

<i>Очистить от информации риг для копирования на другую флешку</i>

<code>honey beforecopy</code>

<br/><br/><br/><br/>

ENGLISH VERSION

<br/>
The client (honeyOS build) is located here: <a  target="_blank" href='https://mega.nz/file/3OQlACpY#hYjRKTNcSZXa53PFv6VtB5DVazxcA6CGn2LjIXSlQeY'>mega.nz</a>

<h2>Features</h2>

- Miner setting
- Overclocking cards
- Hashrate control
- View logs
- Remote commands
- Remote console
- Performance indicators
- Telegram notifications
<br/>

<h4>An overview of the system client configuration, instructions for use</h4>

[![](http://img.youtube.com/vi/QAO7KSql2rM/0.jpg)](http://www.youtube.com/watch?v=QAO7KSql2rM)

<br/>
<h3>A login / password by default</h3>

Server:<br/>
login - crypto@honey<br/>
password - MiningLive

Client:<br/>
login - work<br/>
password - 1

<br/>
<h2>Server installation ~ 15 minutes</h2>

Tested on ubuntu server 18

<i>Pre-configuration steps:</i>
  - Rent a vps server, great choice <a  target="_blank" href='https://poiskvps.ru/index.php?search_hdd_min=10&search_ram_min=1500&search_os%5B%5D=3'>here</a><br/>
 Minimum requirement:<br/>
  -- HDD from 10 Gb<br/>
  -- RAM from 1 Gb<br/>
  -- Not in Russia (if you connect telegrams) or have to look for another proxy
  -- download PuTTY (to connect to the server via ssh) <a target="_blank" href="https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html"> greenend.org.uk</a> или <a target="_blank" href="https://portableapps.com/apps/internet/putty_portable">portableapps.com (portable)</a> 
  
<br/>                       
                                                                                                                                              
After receiving the ip and login / password root user on your server, connect via PuTTY and then:


<br/> 

<i>Switch to superuser</i>

<code>sudo su</code>

<i>Installing the main Ubuntu repositories</i>

<code>sudo add-apt-repository main<br/>
sudo add-apt-repository universe<br/>
sudo add-apt-repository restrict<br/>
sudo add-apt-repository multiverse</code>

<i>Installing the required packages</i>

<code>apt-get -y install git nodejs npm screen</code>

<p>

<i>Copies the latest version of the server</i>

<code>cd /</code>

<code>git clone https://github.com/honey-system/honeyserver.git</code>


<i>Starting the installation</i>

<code>/honeyserver/server.sh setup</code>

<br/><br/>

<h4>Server setting</h4>

Before starting, you need to configure:

You can configure the user name (optional) that will be created when the server is initialized:

Edit the file:

<code>nano /honeyserver/server/entity/account.json</code>

to change lines

<code>"email": "<b>your email, it is important to have @ in the line</b>",</code>

<code>"password": "<b>your password</b>",</code>

save the file and exit the editor:

ctrl + o  =>  enter  => ctrl + z

<br/>

If you already had a database, we recommend that you delete or move it:

<i>Удаление </i>

<code>rm /honeyserver/storage/database.db</code>

<i>Movement </i>

<code>mv /honeyserver/storage/database.db /honeyserver/storage/database.db.bkp</code>


<i>Start data creation (<b>Required the first time</b>) </i>

<code>/honeyserver/server.sh init</code>

<br/>

If there is no file <b>config.json</b> in the folder /honeyserver/server/  - copy it from the sample with the command:

<code>cp /honeyserver/server/config.json.tmpl /honeyserver/server/config.json</code>

<br/>

If you use telegram bot, you need to create it and enter the received key in the file
<b>config.json</b> :

Edit the file:

<code>nano /honeyserver/server/config.json</code>

to change the line

<code>"telegramToken": "<b>you key</b>",</code>

save the file and exit the editor:

ctrl + o  =>  enter  => ctrl + z

<br/>


<br/>
<b>All setup is finished!</b>
<br/>
<br/>

<b>If you previously entered "sudo su" - now you need to exit this mode by running the command "exit"</b>

<i>You can now start the server</i>

<code>/honeyserver/server.sh start</code>



<br/><br/>

<h4>Server commands</h4>

<i>Start </i>

<code>/honeyserver/server.sh start</code>

<i>Stop </i>

<code>/honeyserver/server.sh stop</code>

<i>Restart </i>

<code>/honeyserver/server.sh restart</code>

<i>Monitoring </i>

<code>/honeyserver/server.sh monitor</code>

or 

<code>/honeyserver/server.sh m</code>

<i><b>Important</b>: how to exit monitoring:</i>

<b>CTRL + A => CTRL + D</b>

<i>View logs </i>

<code>/honeyserver/server.sh log</code>

<i>Upgrading to a new version of the server

<code>/honeyserver/server.sh update</code>


<br/>
<h2>Quick setting of the client (build)</h2>
<br/>

1. Скачать:
    - HoneyOS <a target="_blank" href='https://mega.nz/file/3OQlACpY#hYjRKTNcSZXa53PFv6VtB5DVazxcA6CGn2LjIXSlQeY'>mega.nz</a>
    - HDD Raw Copy Tool portable <a target="_blank" href="http://hddguru.com/software/HDD-Raw-Copy-Tool/HDDRawCopy1.10Portable.exe" >hddguru.com</a>
    - HDD LLF Low Level Format Tool portable <a target="_blank" href="http://hddguru.com/software/HDD-LLF-Low-Level-Format-Tool/HDDLLF.4.40.exe">hddguru.com</a>
    - 7-zip <a target="_blank" href="https://www.7-zip.org/a/7z1805.exe">7-zip.org</a>    
    - PuTTY (to connect to Rig via ssh) <a target="_blank" href="https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html"> greenend.org.uk</a> 
    <a target="_blank" href="https://portableapps.com/apps/internet/putty_portable">portableapps.com (portable)</a> 
    
2. Create of Rigs, to assign them to the miners
    - Burn the image to a disk or USB flash drive:
    - Unzip HoneyOS image
    - Connect a USB flash drive, or if it is HDD - via adapter or directly to sata
    - In HDD Raw Copy Tool portable in the first step - select an image, then
    - Select target disk - be careful!
    - Start
    - When finished, go to the "HONEY_CONF" disk and in the "rig.conf" file enter the id of the rig and its password (or you can do this at system startup)
    - In the file "server.conf " enter the IP address of your VPS server and port 3000, for example: <br/>
          HONEY_SERVER="http://1.2.3.4:3000/" <br/>
              don't forget / at the end of the address
    - Ready, the flash drive or disk can be connected to Rig
  
<br/>  
If the image recording is interrupted, use the "HDD LLF Low Level Format Tool" to erase the disk completely, then try again


<br/><br/>

<h4>Client commands (builds)</h4>

<i>Start the miner</i>

<code>miner start</code>

<i>Miner stop</i>

<code>miner stop</code>

<i>Restart miner</i>

<code>miner restart</code>

<i>Performance monitor of rig</i>

<code>honey m</code>

<i><b>Importantly</b>: How to get out of monitoring (the only way!):</i>

<b><code>honey sm</code></b>


<i>A log of the last</i>

<code>log</code>

<i>Log penultimate</i>

<code>log last</code>

<i>100% reload Rig (sometimes the cards do not give it)</i>

<code>honey hr</code>

<i>Get the configuration from the server (very rarely needed)</i>

<code>honey updateconf</code>

<i>Update client to the latest version</i>

<code>honey upgrade</code>

<i>Clear information from rig to copy to another flash drive</i>

<code>honey beforecopy</code>


