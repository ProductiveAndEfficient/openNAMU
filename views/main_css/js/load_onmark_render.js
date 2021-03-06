// Tool
function do_url_change(data) {
    return encodeURIComponent(data);
}

function do_return_date() {
    var today_data = new Date();

    return '' +
        String(today_data.getFullYear()) + '-' + 
        ((today_data.getMonth() + 1) < 10 ? '0' : '') + String(today_data.getMonth() + 1) + '-' + 
        (today_data.getDate() < 10 ? '0' : '') + String(today_data.getDate()) + ' ' + 
        (today_data.getHours() < 10 ? '0' : '') + String(today_data.getHours()) + ':' + 
        (today_data.getMinutes() < 10 ? '0' : '') + String(today_data.getMinutes()) + ':' + 
        (today_data.getSeconds() < 10 ? '0' : '') + String(today_data.getSeconds()) +
    '';
}

// Sub
function do_onmark_text_render(data) {    
    data = data.replace(/'''((?:(?!''').)+)'''/g, '<b>$1</b>');
    data = data.replace(/''((?:(?!'').)+)''/g, '<i>$1</i>');
    data = data.replace(/__((?:(?!__).)+)__/g, '<u>$1</u>');
    data = data.replace(/\^\^((?:(?!\^\^).)+)\^\^/g, '<sup>$1</sup>');
    data = data.replace(/,,((?:(?!,,).)+),,/g, '<sub>$1</sub>');
    data = data.replace(/--((?:(?!--).)+)--/g, '<s>$1</s>');
    data = data.replace(/~~((?:(?!~~).)+)~~/g, '<s>$1</s>');
    
    return data;
}

function do_onmark_heading_render(data) {
    var heading_re = /<br>(={1,6}) ?([^=]+) ?={1,6}<br>/;
    var heading_level_all = [0, 0, 0, 0, 0, 0];
    var toc_data = '<div id="toc"><div id="toc_title">TOC</div><br>';
    while(1) {        
        var heading_data = data.match(heading_re);
        if(!heading_data) {
            break;
        }
          
        var heading_level = heading_data[1].length;
        heading_level_all[heading_level - 1] += 1;

        var i = 6;
        while(i > heading_level - 1) {
            heading_level_all[i] = 0;

            i -= 1;
        }

        heading_level = String(heading_level);
        var heading_level_string = '';
        i = 0;
        while(i < 6) {
            if(heading_level_all[i] !== 0) {
                heading_level_string += String(heading_level_all[i]) + '.';
            }

            i += 1;
        }
        
        var heading_level_string_no_end = heading_level_string.replace(/\.$/, '');

        toc_data += '' +
            '<span style="margin-left: ' + String((heading_level_string.match(/\./g).length - 1) * 10) + 'px;">' +
                '<a href="#s-' + heading_level_string_no_end + '">' + 
                    heading_level_string + ' ' +
                '</a>' + heading_data[2] +
            '</span>' +
            '<br>' +
        ''
        data = data.replace(heading_re, 
            '<h' + heading_level + ' id="s-' + heading_level_string_no_end + '">' + 
                '<a href="#toc">' + heading_level_string + '</a> ' + heading_data[2] + 
            '</h' + heading_level + '>' +
            '<br>'
       );
    }
    
    data = data.replace(/(<\/h[0-9]>)<br>/g, '$1');
    data = data.replace(/\[(?:toc|목차)\]/g, toc_data + '</div>');
    
    return data;
}

function do_onmark_link_render(data, data_js, name_doc, name_include) {
    var link_num = 0;
    data = data.replace(/\[\[(((?!\]\]).)+)\]\]/g, function(x, x_1) {
        var link_split = x_1.split('|');
        var link_real = link_split[0];
        var link_out = link_split[1] ? link_split[1] : link_split[0];
        
        link_num += 1;
        var link_num_str = String(link_num - 1);
        
        if(link_real.match(/^http(s)?:\/\//)) {
            var i = 0;
            while(i < 2) {
                if(i === 0) {
                    var var_link_type = 'href';
                } else {
                    var var_link_type = 'title';
                }
                
                data_js += '' +
                    'document.getElementsByName("' + name_include + 'set_link_' + link_num_str + '")[0].' + var_link_type + ' = ' + 
                        '"' + link_real.replace(/"/g, '\\"') + '";' +
                    '\n' +
                '';
                
                i += 1;
            }
            
            return  '<a id="out_link" ' +
                        'name="' + name_include + 'set_link_' + link_num_str + '" ' + 
                        'title=""' +
                        'href="">' + link_out + '</a>';
        } else {
            var i = 0;
            while(i < 2) {
                if(i === 0) {
                    var var_link_type = 'href';
                    var var_link_data = '/w/' + do_url_change(link_real);
                } else {
                    var var_link_type = 'title';
                    var var_link_data = link_real.replace(/"/g, '\\"');
                }
                
                data_js += '' +
                    'document.getElementsByName("' + name_include + 'set_link_' + link_num_str + '")[0].' + var_link_type + ' = ' + 
                        '"' + var_link_data + '";' +
                    '\n' +
                '';
                
                i += 1;
            }
            
            return  '<a class="' + name_include + 'link_finder" ' +
                        'name="' + name_include + 'set_link_' + link_num_str + '" ' +
                        'title="" ' +
                        'href="">' + link_out + '</a>';
        }
    });
    
    return [data, data_js];
}

function do_onmark_footnote_render(data, name_include) {
    var footnote_end_data = '';
    var footnote_all_data = {};
    var footnote_re = /(?:\[\*([^ \]]*)(?: ((?:(?!<br>|\]).)+))?\]|\[(footnote|각주)\])/;
    var i = 1;
    while(1) {
        var footnote_data = data.match(footnote_re);
        if(!footnote_data) {
            break;
        }
        
        if(!footnote_data[3]) {
            if(!footnote_data[2]) {
                var footnote_line_data = '';
            } else {
                var footnote_line_data = footnote_data[2];
            }
            
            if(!footnote_data[1]) {
                var footnote_name = String(i);
            } else {
                var footnote_name = footnote_data[1];
            }
            
            if(!footnote_all_data[footnote_name]) {
                footnote_all_data[footnote_name] = footnote_line_data;
            }

            footnote_line_data = footnote_all_data[footnote_name];
            
            footnote_end_data += '' +
                '<li>' +
                    '<a href="javascript:do_open_foot(\'' + name_include + 'fn-' + String(i) + '\', 1);" ' +
                        'id="' + name_include + 'cfn-' + String(i) + '">' +
                        '(' + footnote_name + ')' +
                    '</a> <span id="' + name_include + 'fn-' + String(i) + '">' + footnote_line_data + '</span>' +
                '</li>' +
            '';
            data = data.replace(footnote_re, '' +
                '<sup>' +
                    '<a href="javascript:do_open_foot(\'' + name_include + 'fn-' + String(i) + '\', 0);" ' +
                        'id="' + name_include + 'rfn-' + String(i) + '">' +
                        '(' + footnote_name + ')' +
                    '</a>' +
                '</sup><span id="' + name_include + 'dfn-' + String(i) + '"></span>' +
           '');
            
            i += 1;
        } else {
            if(footnote_end_data !== '') {
                data = data.replace(footnote_re, '<ul id="footnote_data">' + footnote_end_data + '</ul>');    
            }
            
            footnote_end_data = '';
        }
    }
    
    if(footnote_end_data !== '') {
        data += '<ul id="footnote_data">' + footnote_end_data + '</ul>';
    }
    
    return data;
}

function do_onmark_macro_render(data) {
    data = data.replace(/\[([^[\](]+)\(((?:(?!\)\]).)+)\)\]/g, function(x, x_1, x_2) {
        x_1 = x_1.toLowerCase();
        if(x_1 === 'youtube' || x_1 === 'kakaotv' || x_1 === 'nicovideo') {
            var video_code = x_2.match(/^([^,]+)/);
            video_code = video_code ? video_code[1] : '';
            
            var video_width = x_2.match(/,(?: *)width=([0-9]+)/);
            video_width = video_width ? (video_width[1] + 'px') : '640px';
            
            var video_height = x_2.match(/,(?: *)height=([0-9]+)/);
            video_height = video_height ? (video_height[1] + 'px') : '360px';
            
            if(x_1 === 'youtube') {
                var video_start = x_2.match(/,(?: *)start=([0-9]+)/);
                video_start = video_start ? ('?' + video_start[1]) : '';
                
                video_code = video_code.replace(/^https:\/\/www\.youtube\.com\/watch\?v=/, '');
                video_code = video_code.replace(/^https:\/\/youtu\.be\//, '');
                
                var video_src = 'https://www.youtube.com/embed/' + video_code + video_start
            } else if(x_1 === 'kakaotv') {
                video_code = video_code.replace(/^https:\/\/tv\.kakao\.com\/channel\/9262\/cliplink\//, '');
                video_code = video_code.replace(/^http:\/\/tv\.kakao\.com\/v\//, '');
                
                var video_src = 'https://tv.kakao.com/embed/player/cliplink/' + video_code +'?service=kakao_tv'
            } else {
                var video_src = 'https://embed.nicovideo.jp/watch/' + video_code
            }
            
            return '<iframe style="width: ' + video_width + '; height: ' + video_height + ';" src="' + video_src + '" frameborder="0" allowfullscreen></iframe>';
        } else if(x_1 === 'anchor') {
            return '<span id="' + x_2 + '"></span>';
        } else {
            return '<macro_start>' + x_1 + '(' + x_2 + ')<macro_end>';
        }
    });
    
    data = data.replace(/\[([^[*()\]]+)\]/g, function(x, x_1) {
        x_1 = x_1.toLowerCase();
        if(x_1 === 'date') {
            return do_return_date();
        } else if(x_1 === 'clearfix') {
            return '<div style="clear:both"></div>';
        } else if(x_1 === 'br') { 
            return '<br>';
        } else {
            return '<macro_start>' + x_1 + '<macro_end>';
        }
    });
    
    data = data.replace(/<macro_start>/g, '[');
    data = data.replace(/<macro_end>/g, ']');
    
    return data;
}

function do_onmark_middle_render(data, data_js, name_include) {
    var middle_stack = [];
    var middle_re = /(?:{{{([^{} ]+)|(}}}))/;
    
    var syntax_on = 0;
    
    var html_n = 0;
    
    while(1) {
        var middle_data = data.match(middle_re);
        if(!middle_data) {
            break;
        }
        
        if(middle_data[2]) {
            if(middle_stack.length === 0) {
                data = data.replace(middle_re, '<middle_end>');   
            } else {
                data = data.replace(middle_re, middle_stack[middle_stack.length - 1]);    
                middle_stack.pop();
            }
        } else {
            if(middle_data[1].match(/^(?:(#(?:[0-9a-f-A-F]{3}){1,2})|#([a-zA-Z]+))/)) {
                var color = middle_data[1].match(/^(?:(#(?:[0-9a-f-A-F]{3}){1,2})|#([a-zA-Z]+))/);
                color = color[1] ? color[1] : color[2];
                
                data = data.replace(middle_re, '<span style="color: ' + color + ';">');
                middle_stack.push('</span>');
            } else if(middle_data[1].match(/^(\+|-)([1-5])/)) {
                var font = middle_data[1].match(/^(\+|-)([1-5])/);
                if(font[1] === '+') {
                    var font_size = String(100 + (20 * Number(font[2]))) + '%';
                } else {
                    var font_size = String(100 - (10 * Number(font[2]))) + '%';
                }
                
                data = data.replace(middle_re, '<span style="font-size: ' + font_size + ';">');
                middle_stack.push('</span>');
            } else if(middle_data[1] === '#!wiki') {
                var wiki_re = /{{{#!wiki(?: style=["']([^"']*)["']<br>)?/;
                
                var wiki = data.match(wiki_re);
                var wiki_style = wiki[1] ? wiki[1] : '';
                
                data = data.replace(wiki_re, '<div_wiki_start style="' + wiki_style + '">');  
                middle_stack.push('<div_wiki_end>');
            } else if(middle_data[1] === '#!html') {
                html_n += 1;
                
                data = data.replace(middle_re, '<span id="' + name_include + 'render_contect_' + String(html_n) + '">');
                middle_stack.push('</span>');
            } else {
                data = data.replace(middle_re, '<middle_start>' + middle_data[1]);   
            }
        }
    }
    
    while(middle_stack.length !== 0) {
        data += middle_stack[middle_stack.length - 1];
        middle_stack.pop();
    }
    
    data = data.replace(/<br><div_wiki_end>/g, '<div_wiki_end>');
    
    data = data.replace(/<middle_start>/g, '{{{');
    data = data.replace(/<middle_end>/g, '}}}');
    
    return [data, data_js];
}

function do_onmark_last_render(data) {
    // middle_render 마지막 처리
    data = data.replace(/<div_wiki_start /g, '<div ');
    data = data.replace(/<div_wiki_end>/g, '</div>');
    
    // br 마지막 처리
    data = data.replace(/^(<br>| )+/, '');
    data = data.replace(/(<br>| )+$/, '');
    
    return data;
}

function do_onmark_include_render(data, data_js) {
    var include_re = /\[include\((((?!\)\]).)+)\)\]/;
    while(1) {
        var include_data = data.match(include_re);
        if(!include_data) {
            break;
        }
        
        data = data.replace(include_re, '');
    }
    
    return [data, data_js];
}

function do_onmark_nowiki_before_render(data, data_js) {
    return [data, data_js];
}

function do_onmark_list_render(data) {
    return data;
}

// Main
function do_onmark_render(name_id, name_include = '', name_doc = '') {
    var data = '<br>' + document.getElementById(name_id).innerHTML.replace(/\n/g, '<br>') + '<br>';
    var data_js = '';
    
    var var_data = do_onmark_nowiki_before_render(data, data_js, name_include);
    data = var_data[0];
    data_js = var_data[1];
    
    var_data = do_onmark_include_render(data, data_js, name_include);
    data = var_data[0];
    data_js = var_data[1];
    
    var_data = do_onmark_middle_render(data, data_js, name_include);
    data = var_data[0];
    data_js = var_data[1];
    
    data = do_onmark_text_render(data);
    data = do_onmark_heading_render(data);
    
    var_data = do_onmark_link_render(data, data_js, name_doc, name_include);
    data = var_data[0];
    data_js = var_data[1];
    
    data = do_onmark_macro_render(data);
    data = do_onmark_list_render(data);
    data = do_onmark_footnote_render(data, name_include);
    data = do_onmark_last_render(data, name_include);
    
    data_js += '' + 
        'get_link_state("' + name_include + '");\n' + 
        'get_file_state("' + name_include + '");\n' + 
    ''
    data_js = 'render_html("' + name_include + 'render_contect");\n' + data_js
    
    document.getElementById(name_id).innerHTML = data;
    eval(data_js);
}