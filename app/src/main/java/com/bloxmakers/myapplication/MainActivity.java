package com.bloxmakers.myapplication;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonArrayRequest;
import com.android.volley.toolbox.Volley;
import com.bumptech.glide.Glide;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private List<JSONObject> empresasOriginal = new ArrayList<>();
    private List<JSONObject> empresasFiltradas = new ArrayList<>();
    private EmpresaAdapter adapter;
    private final String API_URL = "https://localhub-proyecto.onrender.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        RecyclerView rv = findViewById(R.id.recyclerView);
        EditText search = findViewById(R.id.searchField);

        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = new EmpresaAdapter();
        rv.setAdapter(adapter);

        descargarDatos();

        search.addTextChangedListener(new TextWatcher() {
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filtrar(s.toString());
            }
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    private void descargarDatos() {
        RequestQueue queue = Volley.newRequestQueue(this);
        JsonArrayRequest request = new JsonArrayRequest(Request.Method.GET, API_URL, null,
                response -> {
                    empresasOriginal.clear();
                    for (int i = 0; i < response.length(); i++) {
                        empresasOriginal.add(response.optJSONObject(i));
                    }
                    filtrar("");
                }, error -> Toast.makeText(this, "Error de conexión", Toast.LENGTH_LONG).show());
        queue.add(request);
    }

    private void filtrar(String query) {
        empresasFiltradas.clear();
        for (JSONObject item : empresasOriginal) {
            String nombre = item.optString("nombre").toLowerCase();
            String cat = item.optString("categoria").toLowerCase();
            if (nombre.contains(query.toLowerCase()) || cat.contains(query.toLowerCase())) {
                empresasFiltradas.add(item);
            }
        }
        adapter.notifyDataSetChanged();
    }

    // --- ADAPTADOR ---
    class EmpresaAdapter extends RecyclerView.Adapter<EmpresaAdapter.VH> {
        @NonNull
        @Override
        public VH onCreateViewHolder(@NonNull ViewGroup p, int vt) {
            View v = LayoutInflater.from(p.getContext()).inflate(R.layout.item_empresa, p, false);
            return new VH(v);
        }

        @Override
        public void onBindViewHolder(@NonNull VH h, int pos) {
            JSONObject emp = empresasFiltradas.get(pos);
            h.name.setText(emp.optString("nombre"));
            h.cat.setText(emp.optString("categoria"));

            // Cargar Logo con Glide
            Glide.with(MainActivity.this)
                    .load(emp.optString("logoUrl"))
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .into(h.img);

            h.btnWs.setOnClickListener(v -> {
                String tel = emp.optString("whatsapp");
                if (!tel.isEmpty()) {
                    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + tel));
                    startActivity(i);
                }
            });
        }

        @Override public int getItemCount() { return empresasFiltradas.size(); }

        class VH extends RecyclerView.ViewHolder {
            TextView name, cat;
            ImageView img;
            View btnWs;
            VH(View v) {
                super(v);
                name = v.findViewById(R.id.txtNombre);
                cat = v.findViewById(R.id.txtCategoria);
                img = v.findViewById(R.id.imgLogo);
                btnWs = v.findViewById(R.id.btnWhatsApp);
            }
        }
    }
}