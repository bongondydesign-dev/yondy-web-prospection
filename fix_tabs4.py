import os

def fix_app():
    with open('src/App.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # The right column's section currently ends with:
    #             </div>
    #           </div>
    #         </section>
    #       </main>
    # 
    # We need to insert `</>)}` before the `</section>`.

    search_str = "            </div>\n\n          </div>\n\n        </section>\n\n      </main>"
    replace_str = "            </div>\n\n          </div>\n\n          </>)}\n        </section>\n\n      </main>"
    
    if search_str in content:
        content = content.replace(search_str, replace_str)
    else:
        # try more flexible
        content = content.replace(
            "          </div>\n\n        </section>\n\n      </main>",
            "          </div>\n\n          </>)}\n        </section>\n\n      </main>"
        )

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app()
