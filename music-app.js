$(document).ready(function() {


    var expanded = new Array(600);
    var userexpanded = new Array(600)


    for (var i = 0; i < expanded.length; ++i) {
        expanded[i] = false;
        userexpanded[i] = false
    }
    var sortbyti = false;
    var oldvalue, addid, remid, adduser = 8000;

    var playlistid = 3
    var curtplst
    var socket = io('/');
    var selector

    var option = window.location.pathname.substring(1);

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }


    function showDiv(option) {
        if (option === "playlists") {
            $('ul li:nth-child(2)').addClass('active')
        } else if (option === "library") {
            $("nav li").removeClass('active');
            $('ul li:nth-child(1)').addClass('active')
            $(".content").hide();
            $(".los div").hide();
            $(".titlebutton").hide();
            document.getElementById('searchbar').value = ""
            $(".results").hide();

            $('#songs').fadeIn();
        } else if (option === "search") {
            $("nav li").removeClass('active');
            $('ul li:nth-child(3)').addClass('active')
            $(".content").hide();
            $(".los div").hide();
            $(".titlebutton").hide();
            document.getElementById('searchbar').value = ""
            $(".results").hide();

            $('#search').fadeIn();
        }

    }

    window.MUSIC_DATA = {};
    var songsLoaded = false;
    var playlistsLoaded = false;
    var usersLoaded = false;

    var attemptRunApplication = function() {
        if (songsLoaded == true && playlistsLoaded == true && usersLoaded == true) {
            // some function you have for executing the JS in your music-app.js from previous exercise:
            runApplication();
        }
    };

    var AjaxRequest = function(path, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                callback(xhr.responseText);
            }
        }
        xhr.open('GET', path);
        xhr.send(null);
    };

    var AjaxPostRequest = function(path, data) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                } else if (xhr.status === 404) {
                    console.log(xhr.responseText);
                }

            }
        }


        var string = JSON.stringify(data)
        console.log(string)
        xhr.open('POST', path);
        xhr.send(string);
    };

    var AjaxDeleteRequest = function(path, data) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    console.log(xhr.responseText);
                } else if (xhr.status === 404) {
                    console.log(xhr.responseText);
                }

            }
        }


        var string = JSON.stringify(data)
        console.log(string)
        xhr.open('DELETE', path);
        xhr.send(string);
    };

    AjaxRequest('/api/users', function(data) {
        // Transform the response string into a JavaScript object
        var userArray = JSON.parse(data);
        window.MUSIC_DATA['users'] = userArray;
        window.MUSIC_DATA.users = $.map(window.MUSIC_DATA.users, function(el) {
            return el
        });
        usersLoaded = true;

        attemptRunApplication();
    });


    AjaxRequest('/api/playlists', function(data) {
        // Transform the response string into a JavaScript object
        var playlistArray = JSON.parse(data);
        window.MUSIC_DATA['playlists'] = playlistArray;
        window.MUSIC_DATA.playlists = $.map(window.MUSIC_DATA.playlists, function(el) {
            return el
        });
        songsLoaded = true;

        attemptRunApplication();
    });

    AjaxRequest('/api/songs', function(data) {
        // Transform the response string into a JavaScript object
        var songsArray = JSON.parse(data);
        window.MUSIC_DATA['songs'] = songsArray;
        window.MUSIC_DATA.songs = $.map(window.MUSIC_DATA.songs, function(el) {
            return el
        });
        for (var i = 0; i < window.MUSIC_DATA.songs.length; i++) {
            window.MUSIC_DATA.songs[i].id--
        }
        playlistsLoaded = true;

        attemptRunApplication();
    });



    $("nav li").click(function() {
        $("nav li").removeClass('active');
        $(this).addClass("active");
        $(".content").hide();
        $(".los div").hide();
        $(".titlebutton").hide();
        document.getElementById('searchbar').value = ""
        $(".results").hide();
        var selected_tab = $(this).find("a").attr("href");
        $(selected_tab).fadeIn();
        if ($('ul li:nth-child(1)').hasClass('active')) {
            history.pushState(null, null, 'library');
        } else if ($('ul li:nth-child(2)').hasClass('active')) {
            history.pushState(null, null, 'playlists');
        } else if ($('ul li:nth-child(3)').hasClass('active')) {
            history.pushState(null, null, 'search');
        }
        return false;
    });

    function removesong(sid, pname) {
        var pid
        window.MUSIC_DATA.playlists.forEach(function(playlist) {
            if (pname == playlist.name) {
                pid = playlist.id
                var index = playlist.songs.indexOf(parseInt(sid));

                if (index > -1) {
                    playlist.songs.splice(index, 1);
                }
                console.log(playlist.songs)
            }
        });
        AjaxDeleteRequest('/api/playlists/' + pid, parseInt(sid))
        socket.emit('deleteSongFromPlaylist', {
            song: parseInt(sid),
            playlist: pid
        })

    }


    function expandsection(id, name) {
        window.MUSIC_DATA.songs.sort(function(a, b) {

            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;


        })
        $("nav li").removeClass('active');
        $(".titlebutton").hide();
        $(".content").hide();
        $(".los").remove();
        $('ul li:nth-child(2)').addClass('active')
        $('.container').append("<div class='los " + name + "'></div>");
        var plst = $.grep(window.MUSIC_DATA.playlists, function(e) {
            return e.id == id;
        })
        for (var key in plst[0].songs) {
            var title = window.MUSIC_DATA.songs[plst[0].songs[key]].title;
            if (expanded[id] == false) {
                $("[class='los " + name + "']").before("<div class = 'titlebutton' id = '" + name + "title'><div class = 'listitle' >" + plst[0].name + "</div><div><button class = 'userbutton'>+ User</button></div></div>");
            } else {
                $("#" + name + "title").show()
            };
            expanded[id] = true;

            $("[class='los " + name + "']").append('<img src="gray.png" alt= "' + title + '">');
            $("[class='los " + name + "']").append('<h4>' + title + '</h4>');
            $("[class='los " + name + "']").append('<span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
            $("[class='los " + name + "']").append('<span class="glyphicon glyphicon-plus-sign" aria-hidden="true"><span class="hidden">' + window.MUSIC_DATA.songs[plst[0].songs[key]].id + '</span></span>');
            $("[class='los " + name + "']").append('<span class="glyphicon close">&times;</span>');
            $("[class='los " + name + "']").append('<p>' + window.MUSIC_DATA.songs[plst[0].songs[key]].artist + '</p>');

            $('.los>img, .los>h4, .los>span, .los>p').wrapAll('<div class="music ' + name + '">');



        };
        $("#" + name + "title").show()

    }




    $("#album").on('click', "div.music", function() {
        var text = $(this).text()
        if (text === "90's Mega Mix") {
            expandsection(1, "90")
        } else if (text === "Workout Tracks") {
            expandsection(2, "workout")
        } else if (text === "Daft Punk mix") {
            expandsection(3, "daft")
        }
    });


    $("body").on('click', "div.music.results", function() {
        var text = $(this).text()
        if (text === "90's Mega Mix") {
            expandsection(1, "90")
        } else if (text === "Workout Tracks") {
            expandsection(2, "workout")
        } else if (text === "Daft Punk mix") {
            expandsection(3, "daft")
        }
    });

    function addPlaylist() {
        var name = prompt("Please enter playlist name", "New Playlist");
        if (name != null) {
            $('#album').append('<img src="gray.png" alt= "' + name + '">');
            $('#album').append('<h4>' + name + '</h4>');
            $('#album').append('<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>');
            $('#album').append('<p></p>');

            $('#album>img, #album>h4, #album>span, #album>p').wrapAll('<div class="music ' + window.MUSIC_DATA.playlists.length + '">');

        }
        var element = {}
        element.id = window.MUSIC_DATA.playlists.length + 1;
        element.name = name;
        element.songs = []
        window.MUSIC_DATA.playlists.push(element);

        AjaxPostRequest('/api/playlists', name);
    }




    function Sortsongs(order) {
        for (var key in window.MUSIC_DATA.songs) {

            $('#songs').append('<img src="gray.png" alt= "' + window.MUSIC_DATA.songs[key].title + '">');
            $('#songs').append('<h4>' + window.MUSIC_DATA.songs[key].title + '</h4>');
            $('#songs').append('<span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
            $('#songs').append('<span class="glyphicon glyphicon-plus-sign" aria-hidden="true"><span class="hidden">' + window.MUSIC_DATA.songs[key].id + '</span></span>');
            $('#songs').append('<p>' + window.MUSIC_DATA.songs[key].artist + '</p>');

            $('#songs>img, #songs>h4, #songs>span, #songs>p').wrapAll('<div class="songs ' + order + ' ' + key + '">');


        };
    }

    function runApplication() {

        showDiv(option)
        $('#album').append('<button type="button" class="btn-block button-rounded" id = "plusbutton" aria-label="Playlist">');
        $('#plusbutton').append('<span id = "Playlist">Playlist<span id = "left" class="glyphicon glyphicon-plus" aria-hidden="true"></span></span>');

        for (var key in window.MUSIC_DATA.playlists) {

            $('#album').append('<img src="gray.png" alt= "' + window.MUSIC_DATA.playlists[key].name + '">');
            $('#album').append('<h4>' + window.MUSIC_DATA.playlists[key].name + '</h4>');
            $('#album').append('<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>');
            $('#album').append('<p></p>');

            $('#album>img, #album>h4, #album>span, #album>p').wrapAll('<div class="music ' + key + '">');


        };
        window.MUSIC_DATA.songs.sort(function(a, b) {
            if (a.artist.substring(0, 4) == "The " && b.artist.substring(0, 4) != "The ") {
                if (a.artist.substring(4).toUpperCase() < b.artist.toUpperCase()) return -1;
                if (a.artist.substring(4).toUpperCase() > b.artist.toUpperCase()) return 1;
                return 0;
            } else if (a.artist.substring(0, 4) != "The " && b.artist.substring(0, 4) == "The ") {
                if (a.artist.toUpperCase() < b.artist.substring(4).toUpperCase()) return -1;
                if (a.artist.toUpperCase() > b.artist.substring(4).toUpperCase()) return 1;
                return 0;
            } else if (a.artist.substring(0, 4) == "The " && b.artist.substring(0, 4) == "The ") {
                if (a.artist.substring(4).toUpperCase() < b.artist.substring(4).toUpperCase()) return -1;
                if (a.artist.substring(4).toUpperCase() > b.artist.substring(4).toUpperCase()) return 1;
                return 0;
            } else {
                if (a.artist.toUpperCase() < b.artist.toUpperCase()) return -1;
                if (a.artist.toUpperCase() > b.artist.toUpperCase()) return 1;
                return 0;
            }

        })
        Sortsongs("artist");
        $('#onebutton').css("box-shadow", "5px 5px 5px black inset")
    }


    var modal = document.getElementById('myModal');
    var usermodal = document.getElementById('userModal');




    var span = document.getElementsByClassName("close")[0];
    var span1 = document.getElementById("userclose");
    var clist = document.getElementsByClassName("clist");

    $("body").on('click', ".glyphicon.close", function() {

        remid = $(this).siblings('.glyphicon-plus-sign').text()
        var name = $(this).parent().parent().siblings('.titlebutton').children('.listitle').filter(function() {
            return $(this).parent().css('display') != 'none';
        }).text()
        console.log($(".listitle:visible").text())
                console.log(name)


        selector = $(this).parent()
        removesong(remid, name)



    });

    $("body").on('click', ".glyphicon-plus-sign", function() {
        addid = $(this).text()
        modal.style.display = "block";
    });

    $("body").on('click', ".userbutton", function() {

        var id = getCookie("id")
        var array = []
        for (i = 0; i < window.MUSIC_DATA.users.length; i++) {
            if (window.MUSIC_DATA.users[i].id != id) {
                array.push(window.MUSIC_DATA.users[i].username)
            }
        }
        if (userexpanded[id] == false) {
            for (var key in array) {
                $('#usertitle').append('<h4>' + array[key] + '</h4>');
                $('#userModal>div>h4').wrap('<div class="userlist" id = "' + array[key] + '">');
            }
        }
        curtplst = $(this).parent().siblings().text()
        console.log(curtplst)
        userexpanded[id] = true
        console.log(array)
        usermodal.style.display = "block";
    });

    $("body").on('click', "#plusbutton", function() {
        addPlaylist()
    });

    span.onclick = function() {
        modal.style.display = "none";

    }

    span1.onclick = function() {

        usermodal.style.display = "none";
    }

    $("#usertitle").on("click", ".userlist", function() {
        usermodal.style.display = "none";
        var plst = $.grep(window.MUSIC_DATA.playlists, function(e) {
            return e.name == curtplst;
        })
        console.log($(this).text())
        console.log(plst, "cply")

        AjaxPostRequest('/api/playlists/' + plst[0].id + '/users', $(this).text());
    });

    $("#plstmodal").on("click", ".music.clist", function() {
        modal.style.display = "none";
        var index = $(".music.clist").index(this) + 1
        var plst = $.grep(window.MUSIC_DATA.playlists, function(e) {
            return e.id == index;
        })
        if (plst.length != 0) {
            if (!(plst[0].songs.includes(parseInt(addid)))) {
                plst[0].songs.push(parseInt(addid))
                console.log(plst[0].songs, "songs")
            }
        }
        socket.emit('addNewSongToPlaylist', {
            song: parseInt(addid),
            playlist: index
        })

        AjaxPostRequest('/api/playlists/' + index, parseInt(addid));
        if ($('ul li:nth-child(3)').hasClass('active')) {
            switch (index) {
                case 1:
                    expandsection(1, "90");
                    break;
                case 2:
                    expandsection(2, "workout");
                    break;
                case 3:
                    expandsection(3, "daft");
                    break
            }

            $('ul li:nth-child(2)').addClass('active')
        }
    });


    $("body").on('click', "#onebutton", function() {

        $('#onebutton').css("box-shadow", "5px 5px 5px black inset")
        $('#twobutton').css("box-shadow", "none");
        $('.songs.title').hide();
        $('.songs.artist').show();

    });

    $("body").on('click', "#twobutton", function() {

        window.MUSIC_DATA.songs.sort(function(a, b) {
            if (a.title.substring(0, 4) == "The " && b.title.substring(0, 4) != "The ") {
                if (a.title.substring(4) < b.title) return -1;
                if (a.title.substring(4) > b.title) return 1;
                return 0;
            } else if (a.title.substring(0, 4) != "The " && b.title.substring(0, 4) == "The ") {
                if (a.title < b.title.substring(4)) return -1;
                if (a.title > b.title.substring(4)) return 1;
                return 0;
            } else if (a.title.substring(0, 4) == "The " && b.title.substring(0, 4) == "The ") {
                if (a.title.substring(4) < b.title.substring(4)) return -1;
                if (a.title.substring(4) > b.title.substring(4)) return 1;
                return 0;
            } else {
                if (a.title < b.title) return -1;
                if (a.title > b.title) return 1;
                return 0;
            }

        })
        $('#twobutton').css("box-shadow", "5px 5px 5px black inset")
        $('#onebutton').css("box-shadow", "none");
        $('.songs.artist').hide();
        if (sortbyti == false) {
            Sortsongs("title");
        } else {
            $('.songs.title').show();
        }
        sortbyti = true;
    });

    $("#searchbar").keyup(function() {
        var results = [];
        var songs = [];
        $("." + oldvalue).remove();
        if (document.getElementById('searchbar').value != "" && document.getElementById('searchbar').value != " ") {
            var toSearch = document.getElementById('searchbar').value;
        }
        if (document.getElementById('searchbar').value == "") {
            $(".results").hide();
        }


        for (var i = 0; i < window.MUSIC_DATA.playlists.length; i++) {

            if (window.MUSIC_DATA.playlists[i]["name"].indexOf(toSearch) != -1) {
                results.push(window.MUSIC_DATA.playlists[i]);
            }

        }

        for (var i = 0; i < window.MUSIC_DATA.songs.length; i++) {

            if (window.MUSIC_DATA.songs[i]["title"].indexOf(toSearch) != -1) {
                if (!(window.MUSIC_DATA.songs[i] in songs)) {
                    songs.push(window.MUSIC_DATA.songs[i]);
                }
            }

        }
        for (var i = 0; i < window.MUSIC_DATA.songs.length; i++) {

            if (window.MUSIC_DATA.songs[i]["artist"].indexOf(toSearch) != -1) {
                if (!(window.MUSIC_DATA.songs[i] in songs)) {
                    songs.push(window.MUSIC_DATA.songs[i]);
                }
            }

        }


        if (document.getElementsByClassName(toSearch)[0] == null) {
            for (var key in results) {

                $('#search').append('<img src="gray.png" alt= "' + results[key].name + '">');
                $('#search').append('<h4>' + results[key].name + '</h4>');
                $('#search').append('<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>');
                $('#search').append('<p></p>');

                $('#search>img, #search>h4, #search>span, #search>p').wrapAll('<div class="music results ' + toSearch + '">');


            };
            for (var key in songs) {

                $('#search').append('<img src="gray.png" alt= "' + songs[key].title + '">');
                $('#search').append('<h4>' + songs[key].title + '</h4>');
                $('#search').append('<span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
                $('#search').append('<span class="glyphicon glyphicon-plus-sign" aria-hidden="true"><span class="hidden">' + songs[key].id + '</span></span>');
                $('#search').append('<p>' + songs[key].artist + '</p>');


                $('#search>img, #search>h4, #search>span, #search>p').wrapAll('<div class="songs results ' + toSearch + '">');


            };



        };

        $("." + toSearch).show();
        oldvalue = toSearch;
    });

    var deleteSong = function(songData) {
        var playlistId = JSON.parse(songData).playlist;
        var songId = JSON.parse(songData).song
        var name
        console.log("here" + playlistId + songId)
        switch (playlistId) {
            case 1:
                name = "90"
                break;
            case 2:
                name = "work"
                break;
            case 3:
                name = "daft"
                break
        }
        $("div.music." + name).each(function() {
            if ($(this).find('span.hidden').text() == songId) {
                $(this).remove()
            }
        })

    }
    var renderSong = function(songData) {
        var playlistId = JSON.parse(songData).playlist;
        var songId = JSON.parse(songData).song
        var plst = $.grep(window.MUSIC_DATA.playlists, function(e) {
            return e.id == playlistId;
        })
        var song = $.grep(window.MUSIC_DATA.songs, function(e) {
            return e.id == songId;
        })
        var name
        if (plst.length != 0) {
            switch (plst[0].name) {
                case "90's Mega Mix":
                    name = "90"
                    break;
                case "Workout Tracks":
                    name = "work"
                    break;
                case "Daft Punk mix":
                    name = "daft"
                    break
            }


            var title = song[0].title;
            if ($('ul li:nth-child(2)').hasClass('active')) {

                $("[class='los " + name + "']").append('<img src="gray.png" alt= "' + title + '">');
                $("[class='los " + name + "']").append('<h4>' + title + '</h4>');
                $("[class='los " + name + "']").append('<span class="glyphicon glyphicon-play" aria-hidden="true"></span>');
                $("[class='los " + name + "']").append('<span class="glyphicon glyphicon-plus-sign" aria-hidden="true"><span class="hidden">' + songId + '</span></span>');
                $("[class='los " + name + "']").append('<span class="glyphicon close">&times;</span>');
                $("[class='los " + name + "']").append('<p>' + song[0].artist + '</p>');

                $('.los>img, .los>h4, .los>span, .los>p').wrapAll('<div class="music ' + name + '">');
            }
        }
    };

    socket.on('receiveSongsForPlaylist', renderSong);
    socket.on('removeSongsFromPlaylist', deleteSong);


});