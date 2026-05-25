`fetch.py` - Pobiera obrazki z data.json (klucz `original`)
`convert_model.py` - konwersja do formatu frameworku w aplikacji mobilnej
`pre_process.py` - Czyszczenie folderów z danymi, np. jezeli któryś obrazek nie miał annotacji
bounding boxów przeze mnie nie został przenoszony do datasetu.
`main.py` - trening YOLO, parametry zmieniane były na bieząco.

`/runs` - wyniki treningów

Kod został pogrupowany do ładnego wglądu.

Output z nowych treningów miałby inną strukturę jak i potrzebowałby
modyfikacji odpowiednich ściezek do plików.
